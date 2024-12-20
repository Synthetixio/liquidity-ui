import { useToast } from '@chakra-ui/react';
import { D18 } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
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

export function useClaimAllRewards({ accountId }: { accountId?: string }) {
  const { data: rewards } = useRewards({ accountId });

  const toast = useToast({ isClosable: true, duration: 9000 });

  const { network } = useNetwork();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const signer = useSigner();
  const { data: CoreProxy } = useCoreProxy();
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const queryClient = useQueryClient();
  const provider = useProvider();
  const { data: synthTokens } = useSynthTokens();

  const { data: priceUpdateTx } = useCollateralPriceUpdates();
  const { gasSpeed } = useGasSpeed();

  const errorParser = useContractErrorParser();

  const mutation = useMutation({
    mutationFn: async function () {
      if (
        !(network && provider && signer && SpotMarketProxy && CoreProxy && rewards && synthTokens)
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
        .forEach(({ distributor, claimableAmount, claimMethod, args }) => {
          transactions.push(CoreProxyContract.populateTransaction[claimMethod](...args));
          const synthToken = synthTokens.find(
            (synth) => synth.address.toLowerCase() === distributor.payoutToken.address.toLowerCase()
          );
          log('synthToken', synthToken);
          log('claimableAmount', claimableAmount);
          if (synthToken && claimableAmount && claimableAmount.gt(0)) {
            const minAmountReceived = claimableAmount
              .toBN()
              .sub(claimableAmount.toBN().div(100))
              .mul(ethers.utils.parseUnits('1', synthToken.token?.decimals))
              .div(D18);

            transactions.push(
              SpotMarketProxyContract.populateTransaction.unwrap(
                synthToken.synthMarketId,
                claimableAmount.toBN(),
                minAmountReceived
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

    onSuccess: async () => {
      const deployment = `${network?.id}-${network?.preset}`;
      await Promise.all(
        [
          //
          'PriceUpdates',
          'Rewards',
          'TokenBalance',
          'SynthBalances',
          'EthBalance',
        ].map((key) => queryClient.invalidateQueries({ queryKey: [deployment, key] }))
      );
      dispatch({ type: 'success' });

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
