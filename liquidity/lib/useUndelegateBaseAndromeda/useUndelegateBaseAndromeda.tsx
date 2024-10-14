import { parseUnits } from '@snx-v3/format';
import { getRepayerContract, USDC_BASE_MARKET } from '@snx-v3/isBaseAndromeda';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { DEBT_REPAYER_ABI } from '@snx-v3/useClearDebt';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useGetUSDTokens } from '@snx-v3/useGetUSDTokens';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import { BigNumber, Contract, ethers, PopulatedTransaction } from 'ethers';
import { useReducer } from 'react';

export const useUndelegateBaseAndromeda = ({
  accountId,
  poolId,
  collateralTypeAddress,
  collateralChange,
  currentCollateral,
  liquidityPosition,
}: {
  accountId?: string;
  poolId?: string;
  collateralTypeAddress?: string;
  currentCollateral: Wei;
  collateralChange: Wei;
  liquidityPosition?: LiquidityPosition;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();

  const signer = useSigner();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();
  const { network } = useNetwork();
  const { data: usdTokens } = useGetUSDTokens();

  const debtExists = liquidityPosition?.debt.gt(0);
  const currentDebt = debtExists && liquidityPosition ? liquidityPosition.debt : wei(0);

  const { approve, requireApproval } = useApprove({
    contractAddress: usdTokens?.USDC,
    //slippage for approval
    amount: parseUnits(currentDebt.toString(), 6).mul(110).div(100),
    spender: getRepayerContract(network?.id),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');
      if (!(CoreProxy && poolId && collateralTypeAddress && SpotMarketProxy)) return;
      if (collateralChange.eq(0)) return;
      if (currentCollateral.eq(0)) return;
      try {
        dispatch({ type: 'prompting' });

        if (debtExists && requireApproval) {
          await approve(false);
        }

        const transactions: Promise<PopulatedTransaction>[] = [];

        const Repayer = new Contract(getRepayerContract(network.id), DEBT_REPAYER_ABI, signer);

        const depositDebtToRepay = Repayer.populateTransaction.depositDebtToRepay(
          CoreProxy.address,
          SpotMarketProxy.address,
          accountId,
          poolId,
          collateralTypeAddress,
          USDC_BASE_MARKET
        );
        transactions.push(depositDebtToRepay);

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

        const burn = CoreProxyContract.populateTransaction.burnUsd(
          BigNumber.from(accountId),
          BigNumber.from(poolId),
          collateralTypeAddress,
          currentDebt.abs().mul(10).toBN()
        );
        transactions.push(burn);

        const populatedTxnPromised = CoreProxyContract.populateTransaction.delegateCollateral(
          BigNumber.from(accountId),
          BigNumber.from(poolId),
          collateralTypeAddress,
          currentCollateral.add(collateralChange).toBN(),
          wei(1).toBN()
        );
        transactions.push(populatedTxnPromised);

        const callsPromise: Promise<
          (ethers.PopulatedTransaction & { requireSuccess?: boolean })[]
        > = Promise.all([...transactions].filter(notNil));

        const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);

        calls[1].requireSuccess = false;
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
