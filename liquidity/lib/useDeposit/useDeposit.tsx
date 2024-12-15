import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useReducer } from 'react';

const log = debug('snx:useDeposit');

export const useDeposit = ({
  accountId,
  newAccountId,
  poolId,
  collateralTypeAddress,
  collateralChange,
  currentCollateral,
  availableCollateral,
}: {
  accountId?: string;
  newAccountId: string;
  poolId?: string;
  collateralTypeAddress?: string;
  currentCollateral: Wei;
  availableCollateral?: Wei;
  collateralChange: Wei;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const { gasSpeed } = useGasSpeed();

  const { network } = useNetwork();
  const signer = useSigner();
  const provider = useProvider();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (
        !(
          network &&
          provider &&
          signer &&
          CoreProxy &&
          poolId &&
          collateralTypeAddress &&
          availableCollateral
        )
      ) {
        return;
      }
      if (collateralChange.eq(0)) {
        return;
      }

      dispatch({ type: 'prompting' });
      const walletAddress = await signer.getAddress();
      const id = accountId ?? newAccountId;

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

      // create account only when no account exists
      const createAccount = accountId
        ? undefined
        : CoreProxyContract.populateTransaction['createAccount(uint128)'](
            ethers.BigNumber.from(id)
          );

      log('collateralChange', collateralChange);
      log('availableCollateral', availableCollateral);

      const amountNeeded = collateralChange.sub(availableCollateral);
      log('amountNeeded', amountNeeded);

      // optionally deposit if available collateral not enough
      const deposit = amountNeeded.gt(0)
        ? CoreProxyContract.populateTransaction.deposit(
            ethers.BigNumber.from(id),
            collateralTypeAddress,
            amountNeeded.toBN() // only deposit what's needed
          )
        : undefined;

      log('currentCollateral', currentCollateral);
      log('collateralChange', collateralChange);
      log('newDelegation', currentCollateral.add(collateralChange));
      const delegate = CoreProxyContract.populateTransaction.delegateCollateral(
        ethers.BigNumber.from(id),
        ethers.BigNumber.from(poolId),
        collateralTypeAddress,
        currentCollateral.add(collateralChange).toBN(),
        wei(1).toBN()
      );
      const callsPromise = Promise.all([createAccount, deposit, delegate].filter(notNil));

      const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useDeposit',
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
          'Accounts',
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
