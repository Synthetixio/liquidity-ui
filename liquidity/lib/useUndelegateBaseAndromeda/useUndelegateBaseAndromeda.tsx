import { USDC_BASE_MARKET } from '@snx-v3/isBaseAndromeda';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import React from 'react';

export const useUndelegateBaseAndromeda = ({
  accountId,
  poolId,
  collateralTypeAddress,
  collateralChange,
  currentCollateral,
}: {
  accountId?: string;
  poolId?: string;
  collateralTypeAddress?: string;
  currentCollateral: Wei;
  collateralChange: Wei;
  liquidityPosition?: LiquidityPosition;
}) => {
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();

  const signer = useSigner();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();
  const { network } = useNetwork();

  const { data: AccountProxy } = useAccountProxy();
  const { data: DebtRepayer } = useDebtRepayer();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');
      if (
        !(
          CoreProxy &&
          AccountProxy &&
          DebtRepayer &&
          poolId &&
          collateralTypeAddress &&
          SpotMarketProxy
        )
      )
        return;
      if (collateralChange.eq(0)) return;
      if (currentCollateral.eq(0)) return;

      try {
        dispatch({ type: 'prompting' });

        const AccountProxyContract = new ethers.Contract(
          AccountProxy.address,
          AccountProxy.abi,
          signer
        );

        const DebtRepayerContract = new ethers.Contract(
          DebtRepayer.address,
          DebtRepayer.abi,
          signer
        );

        const approveAccountTx = AccountProxyContract.populateTransaction.approve(
          DebtRepayer.address,
          accountId
        );

        const depositDebtToRepay = DebtRepayerContract.populateTransaction.depositDebtToRepay(
          CoreProxy.address,
          SpotMarketProxy.address,
          AccountProxy.address,
          accountId,
          poolId,
          collateralTypeAddress,
          USDC_BASE_MARKET
        );

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

        const delegateTx = CoreProxyContract.populateTransaction.delegateCollateral(
          ethers.BigNumber.from(accountId),
          ethers.BigNumber.from(poolId),
          collateralTypeAddress,
          currentCollateral.add(collateralChange).toBN(),
          wei(1).toBN()
        );

        const callsPromise: Promise<
          (ethers.PopulatedTransaction & { requireSuccess?: boolean })[]
        > = Promise.all([approveAccountTx, depositDebtToRepay, delegateTx].filter(notNil));

        const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);

        if (priceUpdateTx) {
          calls.unshift(priceUpdateTx as any);
        }

        const walletAddress = await signer.getAddress();

        const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
          network,
          calls,
          'useUndelegateBase',
          walletAddress
        );

        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit,
          gasPrices,
          gasSpeed,
        });

        const txn = await signer.sendTransaction({ ...erc7412Tx, ...gasOptionsForTransaction });
        dispatch({ type: 'pending', payload: { txnHash: txn.hash } });

        await txn.wait();
        dispatch({ type: 'success' });
      } catch (error: any) {
        dispatch({ type: 'error', payload: { error } });
        throw error;
      }
    },
    onSuccess: () => {
      // After mutation withERC7412, we guaranteed to have updated all the prices, dont care about await
      refetchPriceUpdateTx();
    },
  });
  return {
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
};
