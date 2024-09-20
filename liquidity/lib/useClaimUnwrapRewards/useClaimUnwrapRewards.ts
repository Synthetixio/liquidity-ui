import { useReducer } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BigNumber } from 'ethers';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';

import { useToast } from '@chakra-ui/react';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { fetchPriceUpdates, priceUpdatesToPopulatedTx } from '@snx-v3/fetchPythPrices';
import { useAllCollateralPriceIds } from '@snx-v3/useAllCollateralPriceIds';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { withERC7412 } from '@snx-v3/withERC7412';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { notNil } from '@snx-v3/tsHelpers';
import Wei from '@synthetixio/wei';
import { useSynthTokens } from '../useSynthTokens';

export function useClaimUnwrapRewards(
  poolId?: string,
  collateralAddress?: string,
  accountId?: string,
  distributorAddress?: string,
  amount?: Wei,
  symbol?: string
) {
  const toast = useToast({ isClosable: true, duration: 9000 });

  const { network } = useNetwork();
  const { data: SpotProxy } = useSpotMarketProxy();
  const signer = useSigner();
  const { data: CoreProxy } = useCoreProxy({
    isWrite: true,
  });
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const client = useQueryClient();
  const { data: collateralPriceUpdates } = useAllCollateralPriceIds();
  const provider = useProvider();
  const { gasSpeed } = useGasSpeed();
  const { data: synthTokens } = useSynthTokens();

  const mutation = useMutation({
    mutationFn: async function () {
      try {
        if (!amount || !signer) return;
        if (!poolId || !collateralAddress || !accountId || !distributorAddress || !network)
          throw new Error('Parameters Undefined');
        if (!CoreProxy) throw new Error('CoreProxy undefined');

        dispatch({ type: 'prompting' });

        const transcations = [];
        transcations.push(
          CoreProxy.populateTransaction.claimRewards(
            BigNumber.from(accountId),
            BigNumber.from(poolId),
            collateralAddress,
            distributorAddress
          )
        );

        const synthToken = synthTokens?.find(
          (synth) => synth.symbol.toUpperCase() === symbol?.toUpperCase()
        );

        if (synthToken) {
          transcations.push(
            SpotProxy?.populateTransaction.unwrap(
              synthToken.synthMarketId,
              amount.toBN(),
              amount.toBN().mul(98).div(100).toNumber().toFixed()
            )
          );
        }

        const callsPromise = Promise.all(transcations.filter(notNil));

        const walletAddress = await signer.getAddress();
        const collateralPriceCallsPromise = fetchPriceUpdates(
          collateralPriceUpdates,
          network?.isTestnet
        ).then((signedData) =>
          priceUpdatesToPopulatedTx(walletAddress, collateralPriceUpdates, signedData)
        );

        const [calls, gasPrices, collateralPriceCalls] = await Promise.all([
          callsPromise,
          getGasPrice({ provider: provider! }),
          collateralPriceCallsPromise,
        ]);

        const allCalls = collateralPriceCalls.concat(calls);

        const erc7412Tx = await withERC7412(
          network,
          allCalls,
          'useClaimUnwrapRewards',
          walletAddress
        );

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
  });

  return {
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
}
