import { useToast } from '@chakra-ui/react';
import { ContractError } from '@snx-v3/ContractError';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePositionManagerNewPool } from '@snx-v3/usePositionManagerNewPool';
import { useSNX } from '@snx-v3/useSNX';
import { useTrustedMulticallForwarder } from '@snx-v3/useTrustedMulticallForwarder';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:useIncreasePositionNewPools');

export function useIncreasePositionNewPool() {
  const [params] = useParams<PositionPageSchemaType>();

  const signer = useSigner();
  const provider = useProvider();
  const { network } = useNetwork();

  const { data: PositionManagerNewPool } = usePositionManagerNewPool();
  const { data: AccountProxy } = useAccountProxy();
  const { data: TrustedMulticallForwarder } = useTrustedMulticallForwarder();
  const { data: SNX } = useSNX();

  const isReady =
    network &&
    provider &&
    signer &&
    TrustedMulticallForwarder &&
    PositionManagerNewPool &&
    AccountProxy &&
    SNX &&
    true;

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!isReady) {
        throw new Error('Not ready');
      }

      toast.closeAll();
      toast({ title: 'Approving SNX...', variant: 'left-accent' });

      const walletAddress = await signer.getAddress();

      const SNXContract = new ethers.Contract(SNX.address, SNX.abi, signer);
      const snxBalance = await SNXContract.balanceOf(walletAddress);
      const snxAppoveGasLimit = await SNXContract.estimateGas.approve(
        PositionManagerNewPool.address,
        snxBalance
      );
      await SNXContract.approve(PositionManagerNewPool.address, snxBalance, {
        gasLimit: snxAppoveGasLimit.mul(15).div(10),
      });

      toast.closeAll();
      toast({ title: 'Updating position...', variant: 'left-accent' });

      const AccountProxyInterface = new ethers.utils.Interface(AccountProxy.abi);
      const PositionManagerNewPoolInterface = new ethers.utils.Interface(
        PositionManagerNewPool.abi
      );

      const multicall = [
        {
          target: AccountProxy.address,
          callData: AccountProxyInterface.encodeFunctionData('approve', [
            PositionManagerNewPool.address,
            ethers.BigNumber.from(params.accountId),
          ]),
          requireSuccess: true,
        },
        {
          target: PositionManagerNewPool.address,
          callData: PositionManagerNewPoolInterface.encodeFunctionData('increasePosition', [
            ethers.BigNumber.from(params.accountId),
            ethers.constants.MaxUint256, // All-in
          ]),
          requireSuccess: true,
        },
      ];
      log('multicall', multicall);

      const TrustedMulticallForwarderContract = new ethers.Contract(
        TrustedMulticallForwarder.address,
        TrustedMulticallForwarder.abi,
        signer
      );
      const populatedTxn =
        await TrustedMulticallForwarderContract.populateTransaction.aggregate3(multicall);
      const gasLimit = await provider.estimateGas(populatedTxn);
      log('gasLimit', gasLimit);
      const txn = await TrustedMulticallForwarderContract.aggregate3(multicall, {
        gasLimit: gasLimit.mul(15).div(10),
      });
      log('txn', txn);
      const receipt = await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);

      return receipt;
    },

    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'New Pool'],
      });

      toast.closeAll();
      toast({
        title: 'Success',
        description: 'Position updated.',
        status: 'success',
        duration: 5000,
        variant: 'left-accent',
      });
    },

    onError: (error) => {
      const contractError = errorParser(error);
      if (contractError) {
        console.error(new Error(contractError.name), contractError);
      }
      toast.closeAll();
      toast({
        title: 'Could not update position',
        description: contractError ? (
          <ContractError contractError={contractError} />
        ) : (
          'Please try again.'
        ),
        status: 'error',
        variant: 'left-accent',
        duration: 3_600_000,
      });
      throw Error('Update failed', { cause: error });
    },
  });

  return {
    isReady,
    mutation,
  };
}
