import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import { BigNumber } from 'ethers';
import { useReducer } from 'react';

export const useUndelegate = ({
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
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();
  const signer = useSigner();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();
  const { network } = useNetwork();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');
      if (!(CoreProxy && poolId && collateralTypeAddress)) return;
      if (collateralChange.eq(0)) return;
      if (currentCollateral.eq(0)) return;
      try {
        dispatch({ type: 'prompting' });

        const populatedTxnPromised = CoreProxy.populateTransaction.delegateCollateral(
          BigNumber.from(accountId),
          BigNumber.from(poolId),
          collateralTypeAddress,
          currentCollateral.add(collateralChange).toBN(),
          wei(1).toBN()
        );

        const walletAddress = await signer.getAddress();

        const callsPromise = Promise.all([populatedTxnPromised]);
        const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);
        if (priceUpdateTx) {
          calls.unshift(priceUpdateTx as any);
        }

        const erc7412Tx = await withERC7412(network, calls, 'useUndelegate', walletAddress);

        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit: erc7412Tx.gasLimit,
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
