import { useToast } from '@chakra-ui/react';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BigNumber } from 'ethers';
import { useReducer } from 'react';
import { useSynthTokens } from '../useSynthTokens';

export function useClaimUnwrapRewards({
  poolId,
  collateralAddress,
  accountId,
  distributorAddress,
  amount,
  payoutTokenAddress,
}: {
  poolId?: string;
  collateralAddress?: string;
  accountId?: string;
  distributorAddress?: string;
  amount?: Wei;
  payoutTokenAddress?: string;
}) {
  const toast = useToast({ isClosable: true, duration: 9000 });

  const { network } = useNetwork();
  const { data: SpotProxy } = useSpotMarketProxy();
  const signer = useSigner();
  const { data: CoreProxy } = useCoreProxy();
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const client = useQueryClient();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();
  const provider = useProvider();
  const { gasSpeed } = useGasSpeed();
  const { data: synthTokens } = useSynthTokens();
  const errorParserCoreProxy = useContractErrorParser(CoreProxy);

  const mutation = useMutation({
    mutationFn: async function () {
      try {
        if (!(signer && network && provider)) throw new Error('No signer or network');
        if (!amount) return;
        if (!poolId || !collateralAddress || !accountId || !distributorAddress)
          throw new Error('Parameters Undefined');
        if (!CoreProxy) throw new Error('CoreProxy undefined');
        if (!SpotProxy) throw new Error('SpotProxy undefined');

        dispatch({ type: 'prompting' });

        const claimRewardsPopulatedTxnPromise = CoreProxy.populateTransaction.claimRewards(
          BigNumber.from(accountId),
          BigNumber.from(poolId),
          collateralAddress,
          distributorAddress
        );

        const synthToken = synthTokens?.find(
          (synth) => synth.address.toUpperCase() === payoutTokenAddress?.toUpperCase()
        );

        const unwrapPopulatedTxnPromise = synthToken
          ? SpotProxy.populateTransaction.unwrap(
              synthToken.synthMarketId,
              amount.toBN(),
              amount.toBN().mul(98).div(100).toNumber().toFixed()
            )
          : undefined;

        const walletAddress = await signer.getAddress();
        const callsPromise = Promise.all([
          claimRewardsPopulatedTxnPromise,
          ...(unwrapPopulatedTxnPromise ? [unwrapPopulatedTxnPromise] : []),
        ]);
        const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);
        if (priceUpdateTx) {
          calls.push(priceUpdateTx as any);
        }
        const erc7412Tx = await withERC7412(network, calls, 'useClaimUnwrapRewards', walletAddress);

        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit: erc7412Tx.gasLimit,
          gasPrices,
          gasSpeed,
        });
        const tx = await signer.sendTransaction({ ...erc7412Tx, ...gasOptionsForTransaction });

        dispatch({ type: 'pending', payload: { txnHash: tx.hash } });

        const res = await tx.wait();

        let claimedAmount: BigNumber | undefined;

        res.logs.forEach((log: any) => {
          if (log.topics[0] === CoreProxy.interface.getEventTopic('RewardsClaimed')) {
            const { amount } = CoreProxy.interface.decodeEventLog(
              'RewardsClaimed',
              log.data,
              log.topics
            );
            claimedAmount = amount;
          }
        });

        dispatch({ type: 'success' });
        client.invalidateQueries({
          queryKey: [
            `${network?.id}-${network?.preset}`,
            'Rewards',
            { accountId },
            { collateralAddress },
          ],
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
      } catch (error) {
        const err = error as Error;

        const contractError = errorParserCoreProxy(error);

        if (contractError) {
          console.error(new Error(contractError.name), contractError);
        }

        dispatch({ type: 'error', payload: { error: err } });

        toast.closeAll();
        toast({
          title: 'Claiming failed',
          description: 'Please try again.',
          status: 'error',
          variant: 'left-accent',
        });

        return 0;
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
