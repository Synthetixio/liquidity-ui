import { parseUnits } from '@snx-v3/format';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { BigNumber, ethers } from 'ethers';
import { useReducer } from 'react';

const log = debug('snx:useWithdraw');

export const useWithdraw = ({
  accountId,
  token,
  amount,
}: {
  accountId?: string;
  token?: { address: string; decimals: number };
  amount: Wei;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();
  const { network } = useNetwork();

  const signer = useSigner();
  const provider = useProvider();

  const isReady = signer && network && provider && CoreProxy && token && amount && amount.gt(0);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!isReady) {
        throw new Error('Not ready');
      }
      const walletAddress = await signer.getAddress();

      dispatch({ type: 'prompting' });

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
      const populatedTxnPromised = CoreProxyContract.populateTransaction.withdraw(
        BigNumber.from(accountId),
        token.address,
        parseUnits(amount.toString(), token.decimals)
      );

      const callsPromise = Promise.all([populatedTxnPromised]);
      const [calls] = await Promise.all([callsPromise]);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useWithdraw',
        walletAddress
      );

      const txn = await signer.sendTransaction({
        ...erc7412Tx,
        gasLimit: gasLimit.mul(15).div(10),
      });
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
          //
          'PriceUpdates',
          'LiquidityPosition',
          'LiquidityPositions',
          'TokenBalance',
          'SynthBalances',
          'EthBalance',
          'Allowance',
          'TransferableSynthetix',
          'AccountCollateralUnlockDate',
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
    isReady,
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
};
