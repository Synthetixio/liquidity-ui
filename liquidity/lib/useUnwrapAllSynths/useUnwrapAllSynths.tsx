import { useToast } from '@chakra-ui/react';
import { ContractError } from '@snx-v3/ContractError';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthBalances } from '@snx-v3/useSynthBalances';
import { logMulticall } from '@snx-v3/withERC7412';
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

  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const { data: Multicall3 } = useMulticall3(network);

  const errorParser = useContractErrorParser();

  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: async function () {
      try {
        if (!(network && provider && signer && SpotMarketProxy && Multicall3 && synthBalances)) {
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
          .filter(({ balance }) => balance.gt(0))
          .forEach(({ synth, balance }) => {
            transactions.push(
              SpotMarketProxyContract.populateTransaction.unwrap(
                synth.synthMarketId,
                balance.toBN(),
                balance.toBN().sub(balance.toBN().div(100))
              )
            );
          });

        const multicall = await Promise.all(transactions);
        await logMulticall({ network, calls: multicall, label: 'useUnwrapAllSynths' });

        const calls = multicall.map(({ to, data }) => ({
          target: to,
          callData: data,
          requireSuccess: false,
        }));
        log('calls', calls);

        const Multicall3Contract = new ethers.Contract(Multicall3.address, Multicall3.abi, signer);
        const txn = await Multicall3Contract.aggregate3(calls);
        log('txn', txn);
        dispatch({ type: 'pending', payload: { txnHash: txn.hash } });

        const receipt = await provider.waitForTransaction(txn.hash);
        log('receipt', receipt);

        dispatch({ type: 'success' });

        return receipt;
      } catch (error: any) {
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
      }
    },
    onSuccess() {
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
