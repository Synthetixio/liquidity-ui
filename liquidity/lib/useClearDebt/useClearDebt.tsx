import { USDC_BASE_MARKET } from '@snx-v3/isBaseAndromeda';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:useClearDebt');

export const useClearDebt = ({
  accountId,
  poolId,
  collateralTypeAddress,
}: {
  accountId?: string;
  poolId?: string;
  collateralTypeAddress?: string;
}) => {
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: AccountProxy } = useAccountProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const signer = useSigner();
  const { network } = useNetwork();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();

  const { data: DebtRepayer } = useDebtRepayer();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');
      if (
        !(
          CoreProxy &&
          poolId &&
          accountId &&
          collateralTypeAddress &&
          SpotMarketProxy &&
          DebtRepayer &&
          AccountProxy
        )
      ) {
        return;
      }

      dispatch({ type: 'prompting' });

      const AccountProxyContract = new ethers.Contract(
        AccountProxy.address,
        AccountProxy.abi,
        signer
      );
      const DebtRepayerContract = new ethers.Contract(DebtRepayer.address, DebtRepayer.abi, signer);

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

      const callsPromise = Promise.all([approveAccountTx, depositDebtToRepay]);

      const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);

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
      dispatch({ type: 'success' });
      return receipt;
    },

    onSuccess: async () => {
      const deployment = `${network?.id}-${network?.preset}`;
      await Promise.all(
        [
          //
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
