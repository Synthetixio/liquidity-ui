import { useToast } from '@chakra-ui/react';
import { ContractError } from '@snx-v3/ContractError';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthBalances } from '@snx-v3/useSynthBalances';
import { withERC7412 } from '@snx-v3/withERC7412';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:useUnwrapAllSynths');

export function useUnwrapAllSynths() {
  const { data: synthBalances } = useSynthBalances();

  const toast = useToast({ isClosable: true, duration: 9000 });

  const { network } = useNetwork();
  const provider = useProvider();
  const signer = useSigner();

  const { gasSpeed } = useGasSpeed();

  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const errorParser = useContractErrorParser();

  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: async function () {
      if (!(network && provider && signer && SpotMarketProxy && synthBalances)) {
        throw new Error('Not ready');
      }

      dispatch({ type: 'prompting' });

      const transactions: Promise<ethers.PopulatedTransaction>[] = [];

      const SpotMarketProxyContract = new ethers.Contract(
        SpotMarketProxy.address,
        SpotMarketProxy.abi,
        signer
      );
      synthBalances
        .filter(({ synthBalance }) => synthBalance.gt(0))
        .forEach(({ synth, synthBalance }) => {
          transactions.push(
            SpotMarketProxyContract.populateTransaction.unwrap(
              synth.synthMarketId,
              synthBalance.toBN(),
              synthBalance.toBN().sub(synthBalance.toBN().div(100))
            )
          );
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
        'useUnwrapAllSynths',
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
        queryKey: [`${network?.id}-${network?.preset}`, 'PriceUpdates'],
      });
      client.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'SynthBalances'],
      });
      client.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'SynthBalances'],
      });
      toast.closeAll();
      toast({
        title: 'Success',
        description: 'Your synths have been unwrapped',
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
