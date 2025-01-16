import { initialState, reducer } from '@snx-v3/txnReducer';
import { useAllowance } from '@snx-v3/useAllowance';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:useApprove');

export const approveAbi = ['function approve(address spender, uint256 amount) returns (bool)'];

export const useApprove = ({
  contractAddress,
  amount,
  spender,
}: {
  contractAddress?: string;
  amount?: ethers.BigNumber;
  spender?: string;
}) => {
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const { data: allowance, refetch: refetchAllowance } = useAllowance({ contractAddress, spender });
  const sufficientAllowance = allowance && amount && allowance.gte(amount);

  const { network } = useNetwork();
  const signer = useSigner();
  const provider = useProvider();

  const queryClient = useQueryClient();
  const isReady = network && provider && signer && contractAddress && spender && amount;
  const mutation = useMutation({
    mutationFn: async (infiniteApproval: boolean) => {
      log(`contractAddress`, contractAddress);
      log(`spender`, spender);
      log(`amount`, amount);
      if (!isReady) {
        throw new Error('Not ready');
      }
      if (sufficientAllowance) {
        dispatch({ type: 'success' });
        return;
      }

      dispatch({ type: 'prompting' });
      const contract = new ethers.Contract(contractAddress, approveAbi, signer);
      const amountToApprove = infiniteApproval ? ethers.constants.MaxUint256 : amount;
      log(`amountToApprove`, amountToApprove);

      const gasLimitPromised = contract.estimateGas.approve(spender, amountToApprove);
      const populatedTxnPromised = contract.populateTransaction.approve(spender, amountToApprove);
      const [gasLimit, populatedTxn] = await Promise.all([gasLimitPromised, populatedTxnPromised]);

      const txn = await signer.sendTransaction({
        ...populatedTxn,
        gasLimit: gasLimit.mul(15).div(10),
      });
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
          'Allowance',
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
    isReady: Boolean(isReady),
    mutation,
    txnState,
    isLoading: mutation.isPending,
    approve: mutation.mutateAsync,
    refetchAllowance,
    requireApproval: !sufficientAllowance,
    allowance,
  };
};
