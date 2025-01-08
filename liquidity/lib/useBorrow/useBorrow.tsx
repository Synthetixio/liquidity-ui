import { POOL_ID } from '@snx-v3/constants';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useReducer } from 'react';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useCollateralType } from '@snx-v3/useCollateralTypes';

const log = debug('snx:useBorrow');

export const useBorrow = ({ borrowAmount }: { borrowAmount?: Wei }) => {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const [txnState, dispatch] = useReducer(reducer, initialState);

  const { data: CoreProxy } = useCoreProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const signer = useSigner();
  const provider = useProvider();
  const { network } = useNetwork();

  const queryClient = useQueryClient();

  const isReady =
    signer &&
    CoreProxy &&
    params.accountId &&
    collateralType?.address &&
    network &&
    provider &&
    !!borrowAmount;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isReady) throw new Error('Not ready');
      dispatch({ type: 'prompting' });

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

      const populatedTxnPromised = CoreProxyContract.populateTransaction.mintUsd(
        ethers.BigNumber.from(params.accountId),
        ethers.BigNumber.from(POOL_ID),
        collateralType?.address,
        borrowAmount.toBN()
      );

      const callsPromise = Promise.all([populatedTxnPromised]);
      const [calls] = await Promise.all([callsPromise]);

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
