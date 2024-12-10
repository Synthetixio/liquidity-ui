import { useToast } from '@chakra-ui/react';
import { ContractError } from '@snx-v3/ContractError';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import React from 'react';

export function useClaimAllRewards(
  rewards: {
    poolId?: string;
    collateralAddress?: string;
    accountId?: string;
    distributorAddress?: string;
    amount?: Wei;
    payoutTokenAddress?: string;
    isPoolReward: boolean;
  }[]
) {
  const toast = useToast({ isClosable: true, duration: 9000 });

  const { network } = useNetwork();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const signer = useSigner();
  const { data: CoreProxy } = useCoreProxy();
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const client = useQueryClient();
  const provider = useProvider();
  const { gasSpeed } = useGasSpeed();
  const { data: synthTokens } = useSynthTokens();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();

  const errorParser = useContractErrorParser();

  const mutation = useMutation({
    mutationFn: async function () {
      try {
        if (!signer || !network || !provider) throw new Error('No signer or network');
        if (!rewards.filter(({ amount }) => amount?.gt(0)).length) return;
        if (!CoreProxy) throw new Error('CoreProxy undefined');
        if (!SpotMarketProxy) throw new Error('SpotMarketProxy undefined');
        if (!synthTokens) throw new Error('synthTokens undefined');

        dispatch({ type: 'prompting' });

        const transactions: (Promise<ethers.PopulatedTransaction> | undefined)[] = [];

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
        const SpotMarketProxyContract = new ethers.Contract(
          SpotMarketProxy.address,
          SpotMarketProxy.abi,
          signer
        );

        rewards.forEach(
          ({
            poolId,
            collateralAddress,
            accountId,
            distributorAddress,
            amount,
            payoutTokenAddress,
            isPoolReward,
          }) => {
            if (isPoolReward) {
              transactions.push(
                CoreProxyContract.populateTransaction.claimPoolRewards(
                  ethers.BigNumber.from(accountId),
                  ethers.BigNumber.from(poolId),
                  collateralAddress,
                  distributorAddress
                )
              );
            } else {
              transactions.push(
                CoreProxyContract.populateTransaction.claimRewards(
                  ethers.BigNumber.from(accountId),
                  ethers.BigNumber.from(poolId),
                  collateralAddress,
                  distributorAddress
                )
              );
            }

            const synthToken = synthTokens.find(
              (synth) => synth.address.toUpperCase() === payoutTokenAddress?.toUpperCase()
            );
            if (synthToken && amount && amount.gt(0)) {
              transactions.push(
                SpotMarketProxyContract.populateTransaction.unwrap(
                  synthToken.synthMarketId,
                  amount.toBN(),
                  amount.toBN().sub(amount?.toBN().div(100))
                )
              );
            }
          }
        );
        const callsPromise = Promise.all(transactions.filter(notNil));
        const walletAddress = await signer.getAddress();

        const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);

        if (priceUpdateTx) {
          calls.unshift(priceUpdateTx as any);
        }

        const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
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
        const tx = await signer.sendTransaction({ ...erc7412Tx, ...gasOptionsForTransaction });

        dispatch({ type: 'pending', payload: { txnHash: tx.hash } });

        const res = await tx.wait();

        let claimedAmount: ethers.BigNumber | undefined;

        res.logs.forEach((log: any) => {
          if (log.topics[0] === CoreProxyContract.interface.getEventTopic('RewardsClaimed')) {
            const { amount } = CoreProxyContract.interface.decodeEventLog(
              'RewardsClaimed',
              log.data,
              log.topics
            );
            claimedAmount = amount;
          }
        });

        dispatch({ type: 'success' });
        client.invalidateQueries({
          queryKey: [`${network?.id}-${network?.preset}`, 'Rewards'],
        });

        toast.closeAll();
        toast({
          title: 'Success',
          description: 'Your rewards has been claimed.',
          status: 'success',
          duration: 5000,
          variant: 'left-accent',
        });

        return claimedAmount;
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
    onSuccess: () => {
      // After mutation withERC7412, we guaranteed to have updated all the prices, dont care about await
      refetchPriceUpdateTx();
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
