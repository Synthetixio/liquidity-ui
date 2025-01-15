import { POOL_ID } from '@snx-v3/constants';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useReducer } from 'react';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';

const log = debug('snx:useUndelegate');

export const useUndelegate = ({ undelegateAmount }: { undelegateAmount?: Wei }) => {
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const collateralTypeAddress = collateralType?.tokenAddress;

  const [txnState, dispatch] = useReducer(reducer, initialState);

  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: CoreProxy } = useCoreProxy();

  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const signer = useSigner();
  const provider = useProvider();
  const { network } = useNetwork();
  const queryClient = useQueryClient();

  const canUndelegate =
    liquidityPosition &&
    liquidityPosition.collateralAmount.gt(0) &&
    undelegateAmount &&
    liquidityPosition.collateralAmount.gte(undelegateAmount);

  const isReady =
    canUndelegate &&
    network &&
    provider &&
    signer &&
    CoreProxy &&
    params.accountId &&
    collateralTypeAddress;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isReady) throw new Error('Not ready');

      dispatch({ type: 'prompting' });

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
      const populatedTxnPromised = CoreProxyContract.populateTransaction.delegateCollateral(
        ethers.BigNumber.from(params.accountId),
        ethers.BigNumber.from(POOL_ID),
        collateralTypeAddress,
        liquidityPosition.collateralAmount.sub(undelegateAmount).toBN(),
        wei(1).toBN()
      );

      const walletAddress = await signer.getAddress();

      const callsPromise = Promise.all([populatedTxnPromised]);
      const [calls] = await Promise.all([callsPromise]);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useUndelegate',
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
    isReady: Boolean(isReady),
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
};
