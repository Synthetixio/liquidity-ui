import { POOL_ID, ZEROWEI } from '@snx-v3/constants';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useReducer } from 'react';

const log = debug('snx:useRepay');

export const useRepay = ({
  accountId,
  collateralTypeAddress,
  debtChange,
  availableUSDCollateral,
}: {
  accountId?: string;
  collateralTypeAddress?: string;
  balance?: Wei;
  availableUSDCollateral?: Wei;
  debtChange: Wei;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();
  const { data: systemToken } = useSystemToken();

  const signer = useSigner();
  const { network } = useNetwork();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');
      if (!(CoreProxy && accountId && collateralTypeAddress && systemToken)) {
        return;
      }
      if (debtChange.eq(0)) {
        return;
      }

      const debtChangeAbs = debtChange.abs();
      const amountToDeposit = debtChangeAbs.sub(availableUSDCollateral || ZEROWEI);

      dispatch({ type: 'prompting' });

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

      // Only deposit if user doesn't have enough sUSD collateral
      const deposit = amountToDeposit.lte(0)
        ? undefined
        : CoreProxyContract.populateTransaction.deposit(
            ethers.BigNumber.from(accountId),
            systemToken.address,
            amountToDeposit.toBN() // only deposit what's needed
          );

      const burn = CoreProxyContract.populateTransaction.burnUsd(
        ethers.BigNumber.from(accountId),
        ethers.BigNumber.from(POOL_ID),
        collateralTypeAddress,
        debtChangeAbs.toBN()
      );

      const callsPromise = Promise.all([deposit, burn].filter(notNil));
      const walletAddress = await signer.getAddress();

      const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);

      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

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
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
};
