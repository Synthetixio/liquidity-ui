import { POOL_ID } from '@snx-v3/constants';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePositionManager } from '@snx-v3/usePositionManager';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useReducer } from 'react';

const log = debug('snx:useRepay');

export function useRepay({ repayAmount }: { repayAmount?: Wei }) {
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const [txnState, dispatch] = useReducer(reducer, initialState);

  const { data: CoreProxy } = useCoreProxy();
  const { data: AccountProxy } = useAccountProxy();
  const { data: PositionManager } = usePositionManager();

  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: systemToken } = useSystemToken();
  const { data: systemTokenBalance } = useTokenBalance(systemToken?.address);

  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const signer = useSigner();
  const { network } = useNetwork();
  const provider = useProvider();

  const availableCollateral =
    systemTokenBalance && liquidityPosition
      ? systemTokenBalance.add(liquidityPosition.availableSystemToken)
      : undefined;

  const canRepay =
    liquidityPosition &&
    liquidityPosition.debt.gt(0) &&
    availableCollateral &&
    repayAmount &&
    availableCollateral.gte(repayAmount);

  const isReady =
    repayAmount &&
    repayAmount.gt(0) &&
    canRepay &&
    network &&
    provider &&
    signer &&
    CoreProxy &&
    AccountProxy &&
    PositionManager &&
    params.accountId &&
    systemToken?.address &&
    collateralType?.tokenAddress;

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!isReady) throw new Error('Not ready');

      dispatch({ type: 'prompting' });

      const AccountProxyContract = new ethers.Contract(
        AccountProxy.address,
        AccountProxy.abi,
        signer
      );
      const TokenContract = new ethers.Contract(
        systemToken?.address,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );
      const PositionManagerContract = new ethers.Contract(
        PositionManager.address,
        PositionManager.abi,
        signer
      );

      const approveAccountTx = AccountProxyContract.populateTransaction.approve(
        PositionManager.address,
        params.accountId
      );
      const approveUsdTx = TokenContract.populateTransaction.approve(
        PositionManager.address,
        repayAmount.toBN()
      );
      const repayTx = PositionManagerContract.populateTransaction.repay(
        CoreProxy.address,
        AccountProxy.address,
        params.accountId,
        POOL_ID,
        collateralType.tokenAddress,
        repayAmount.toBN()
      );

      const callsPromise = Promise.all([approveAccountTx, approveUsdTx, repayTx]);
      const [calls] = await Promise.all([callsPromise]);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const walletAddress = await signer.getAddress();
      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useRepay',
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
}
