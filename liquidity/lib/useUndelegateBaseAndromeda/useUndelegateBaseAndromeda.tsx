import { USDC_BASE_MARKET } from '@snx-v3/isBaseAndromeda';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import { Wei, wei } from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:useUndelegateBaseAndromeda');

export function useUndelegateBaseAndromeda({ collateralChange }: { collateralChange: Wei }) {
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const collateralTypeAddress = collateralType?.tokenAddress;
  const currentCollateral = liquidityPosition?.collateralAmount || wei(0);

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
          params.poolId &&
          params.accountId &&
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
          params.accountId
        );

        const depositDebtToRepay = DebtRepayerContract.populateTransaction.depositDebtToRepay(
          CoreProxy.address,
          SpotMarketProxy.address,
          AccountProxy.address,
          params.accountId,
          params.poolId,
          collateralTypeAddress,
          USDC_BASE_MARKET
        );

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

        const delegateTx = CoreProxyContract.populateTransaction.delegateCollateral(
          ethers.BigNumber.from(params.accountId),
          ethers.BigNumber.from(params.poolId),
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
        log('txn', txn);
        dispatch({ type: 'pending', payload: { txnHash: txn.hash } });

        const receipt = await txn.wait();
        log('receipt', receipt);
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
}
