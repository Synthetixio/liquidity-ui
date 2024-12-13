import { useToast } from '@chakra-ui/react';
import { ContractError } from '@snx-v3/ContractError';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { type CollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { logMulticall } from '@snx-v3/withERC7412';
import { useRewards } from '@snx-v3/useRewards';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
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
  const { data: Multicall3 } = useMulticall3(network);

  const errorParser = useContractErrorParser();

  const mutation = useMutation({
    mutationFn: async function () {
      try {
        if (!signer || !network || !provider) throw new Error('No signer or network');
        if (!rewards || !rewards.some(({ claimableAmount }) => claimableAmount.gt(0))) {
          return;
        }
        if (!CoreProxy) throw new Error('CoreProxy undefined');
        if (!SpotMarketProxy) throw new Error('SpotMarketProxy undefined');
        if (!synthTokens) throw new Error('synthTokens undefined');
        if (!collateralType) throw new Error('collateralType undefined');
        if (!Multicall3) throw new Error('Multicall3 undefined');

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
          .forEach(({ distributor, claimableAmount }) => {
            transactions.push(
              CoreProxyContract.populateTransaction.claimRewards(
                ethers.BigNumber.from(accountId),
                ethers.BigNumber.from(poolId),
                collateralType.address,
                distributor.address
              )
            );
            transactions.push(
              CoreProxyContract.populateTransaction.claimPoolRewards(
                ethers.BigNumber.from(accountId),
                ethers.BigNumber.from(poolId),
                collateralType.address,
                distributor.address
              )
            );
            const synthToken = synthTokens.find(
              (synth) =>
                synth.address.toUpperCase() === distributor.payoutToken.address.toUpperCase()
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

        const multicall = await Promise.all(transactions);
        await logMulticall({ network, calls: multicall, label: 'useClaimAllRewards' });

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
        client.invalidateQueries({
          queryKey: [`${network?.id}-${network?.preset}`, 'Rewards'],
        });

        toast.closeAll();
        toast({
          title: 'Success',
          description: 'Your rewards have been claimed',
          status: 'success',
          duration: 5000,
          variant: 'left-accent',
        });
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
  });

  return {
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
}
