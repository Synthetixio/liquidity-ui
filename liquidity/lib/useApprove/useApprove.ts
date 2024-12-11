import { initialState, reducer } from '@snx-v3/txnReducer';
import { useAllowance } from '@snx-v3/useAllowance';
import { useProvider, useSigner } from '@snx-v3/useBlockchain';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useReducer } from 'react';

const log = debug('snx:useApprove');

export const approveAbi = ['function approve(address spender, uint256 amount) returns (bool)'];

export const useApprove = (
  {
    contractAddress,
    amount,
    spender,
  }: {
    contractAddress?: string;
    amount?: ethers.BigNumber;
    spender?: string;
  },
  eventHandlers?: {
    onSuccess?: () => void;
    onMutate?: () => void;
    onError?: (e: Error) => void;
  }
) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: allowance, refetch: refetchAllowance } = useAllowance({ contractAddress, spender });
  const sufficientAllowance = allowance && amount && allowance.gte(amount);

  const signer = useSigner();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();

  const mutation = useMutation({
    mutationFn: async (infiniteApproval: boolean) => {
      if (!signer || !contractAddress || !spender || !provider || !amount)
        throw new Error('Signer, contract address or spender is not defined');
      if (sufficientAllowance) return;

      log(`contractAddress`, contractAddress);
      log(`spender`, spender);
      log(`amount`, amount);

      try {
        dispatch({ type: 'prompting' });

        const contract = new ethers.Contract(contractAddress, approveAbi, signer);
        const amountToApprove = infiniteApproval ? ethers.constants.MaxUint256 : amount;
        log(`amountToApprove`, amountToApprove);

        const gasPricesPromised = getGasPrice({ provider });
        const gasLimitPromised = contract.estimateGas.approve(spender, amountToApprove);

        const populatedTxnPromised = contract
          .connect(signer)
          .populateTransaction.approve(spender, amountToApprove, {
            gasLimit: gasLimitPromised,
          });

        const [gasPrices, gasLimit, populatedTxn] = await Promise.all([
          gasPricesPromised,
          gasLimitPromised,
          populatedTxnPromised,
        ]);

        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit,
          gasPrices,
          gasSpeed,
        });

        const txn = await signer.sendTransaction({ ...populatedTxn, ...gasOptionsForTransaction });
        log('txn', txn);
        dispatch({ type: 'pending', payload: { txnHash: txn.hash } });

        const receipt = await txn.wait();
        log('receipt', receipt);
        dispatch({ type: 'success' });
        refetchAllowance();
      } catch (error: any) {
        dispatch({ type: 'error', payload: { error } });
        throw error;
      }
    },
    ...eventHandlers,
  });
  return {
    mutation,
    txnState,
    isLoading: mutation.isPending,
    approve: mutation.mutateAsync,
    refetchAllowance,
    requireApproval: !sufficientAllowance,
    allowance,
  };
};
