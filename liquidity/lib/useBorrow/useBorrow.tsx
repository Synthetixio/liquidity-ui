import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useReducer } from 'react';

const log = debug('snx:useBorrow');

export const useBorrow = ({
  accountId,
  poolId,
  collateralTypeAddress,
  debtChange,
}: {
  accountId?: string;
  poolId?: string;
  collateralTypeAddress?: string;
  debtChange: Wei;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const signer = useSigner();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();
  const { network } = useNetwork();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (
        !(
          signer &&
          CoreProxy &&
          poolId &&
          accountId &&
          collateralTypeAddress &&
          network &&
          provider
        )
      ) {
        return;
      }

      if (debtChange.eq(0)) {
        return;
      }

      dispatch({ type: 'prompting' });

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
      const populatedTxnPromised = CoreProxyContract.populateTransaction.mintUsd(
        ethers.BigNumber.from(accountId),
        ethers.BigNumber.from(poolId),
        collateralTypeAddress,
        debtChange.abs().toBN()
      );

      const callsPromise = Promise.all([populatedTxnPromised]);
      const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);

      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const walletAddress = await signer.getAddress();
      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useBorrow',
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

      const receipt = await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);
      return receipt;
    },

    onSuccess: async () => {
      const deployment = `${network?.id}-${network?.preset}`;
      await Promise.all(
        [
          'PriceUpdates',
          'LiquidityPositions',
          'TokenBalance',
          'EthBalance',
          'Allowance',
          'TransferableSynthetix',
        ].map((key) => queryClient.invalidateQueries({ queryKey: [deployment, key] }))
      );
      dispatch({ type: 'success' });
    },

    onError: (error) => {
      dispatch({ type: 'error', payload: { error } });
      throw error;
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
