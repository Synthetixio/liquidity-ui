import { useToast } from '@chakra-ui/react';
import { ContractError } from '@snx-v3/ContractError';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { type CollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useRewards } from '@snx-v3/useRewards';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { withERC7412 } from '@snx-v3/withERC7412';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:useClaimAllRewards');

export function useClaimAllRewards({
  accountId,
  poolId,
  collateralType,
}: {
  accountId?: string;
  poolId?: string;
  collateralType?: CollateralType;
}) {
  const { data: rewards } = useRewards({ accountId, poolId, collateralType });

  const toast = useToast({ isClosable: true, duration: 9000 });

  const { network } = useNetwork();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const signer = useSigner();
  const { data: CoreProxy } = useCoreProxy();
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const client = useQueryClient();
  const provider = useProvider();
  const { data: synthTokens } = useSynthTokens();

  const { data: priceUpdateTx } = useCollateralPriceUpdates();
  const { gasSpeed } = useGasSpeed();

  const errorParser = useContractErrorParser();

  const mutation = useMutation({
    mutationFn: async function () {
      if (
        !(
          network &&
          provider &&
          signer &&
          SpotMarketProxy &&
          CoreProxy &&
          collateralType &&
          rewards &&
          synthTokens
        )
      ) {
        throw new Error('Not ready');
      }

      dispatch({ type: 'prompting' });

      const transactions: Promise<ethers.PopulatedTransaction>[] = [];

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
      const SpotMarketProxyContract = new ethers.Contract(
        SpotMarketProxy.address,
        SpotMarketProxy.abi,
        signer
      );

      rewards
        .filter(({ claimableAmount }) => claimableAmount.gt(0))
        .forEach(({ distributor, claimableAmount, isPoolDistributor }) => {
          const method = isPoolDistributor ? 'claimPoolRewards' : 'claimRewards';
          transactions.push(
            CoreProxyContract.populateTransaction[method](
              ethers.BigNumber.from(accountId),
              ethers.BigNumber.from(poolId),
              collateralType.address,
              distributor.address
            )
          );
          const synthToken = synthTokens.find(
            (synth) => synth.address.toUpperCase() === distributor.payoutToken.address.toUpperCase()
          );
          log('synthToken', synthToken);
          log('claimableAmount', claimableAmount);
          if (synthToken && claimableAmount && claimableAmount.gt(0)) {
            transactions.push(
              SpotMarketProxyContract.populateTransaction.unwrap(
                synthToken.synthMarketId,
                claimableAmount.toBN(),
                claimableAmount.toBN().sub(claimableAmount.toBN().div(100))
              )
            );
          }
        });

      const [calls, gasPrices] = await Promise.all([
        Promise.all(transactions),
        getGasPrice({ provider }),
      ]);
      log('calls', calls);

      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const walletAddress = await signer.getAddress();
      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useClaimAllRewards',
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

    onError(error) {
      const contractError = errorParser(error);
      if (contractError) {
        console.error(new Error(contractError.name), contractError);
      }

      dispatch({ type: 'error', payload: { error } });

      toast.closeAll();
      toast({
        title: 'Claiming failed',
        description: contractError ? (
          <ContractError contractError={contractError} />
        ) : (
          'Please try again.'
        ),
        status: 'error',
        variant: 'left-accent',
        duration: 3_600_000,
      });
    },

    onSuccess() {
      client.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'Rewards'],
      });
      client.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
      });
      toast.closeAll();
      toast({
        title: 'Success',
        description: 'Your rewards have been claimed',
        status: 'success',
        duration: 5000,
        variant: 'left-accent',
      });
    },
  });

  return {
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
}
