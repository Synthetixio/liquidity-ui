import { parseUnits } from '@snx-v3/format';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import { BigNumber, ethers } from 'ethers';
import { useReducer } from 'react';

export const useWithdraw = ({
  accountId,
  collateralTypeAddress,
  amount,
}: {
  accountId?: string;
  collateralTypeAddress?: string;
  amount: Wei;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();
  const { network } = useNetwork();

  const { gasSpeed } = useGasSpeed();
  const signer = useSigner();
  const provider = useProvider();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');

      if (!(CoreProxy && collateralTypeAddress && amount)) {
        throw new Error('Not ready');
      }
      if (amount?.eq(0)) {
        throw new Error('Amount less than 0');
      }

      const walletAddress = await signer.getAddress();

      try {
        dispatch({ type: 'prompting' });

        const contract = new ethers.Contract(
          collateralTypeAddress,
          ['function decimals() view returns (uint8)'],
          provider
        );

        const decimals = await contract.decimals();

        const collateralAmount = amount.gt(0)
          ? parseUnits(amount.toString(), decimals)
          : BigNumber.from(0);

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
        const populatedTxnPromised = CoreProxyContract.populateTransaction.withdraw(
          BigNumber.from(accountId),
          collateralTypeAddress,
          collateralAmount
        );

        const callsPromise = Promise.all([populatedTxnPromised]);
        const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);
        if (priceUpdateTx) {
          calls.unshift(priceUpdateTx as any);
        }

        const erc7412Tx = await withERC7412(network, calls, 'useWithdraw', walletAddress);

        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit: erc7412Tx.gasLimit,
          gasPrices,
          gasSpeed,
        });

        const txn = await signer.sendTransaction({ ...erc7412Tx, ...gasOptionsForTransaction });
        dispatch({ type: 'pending', payload: { txnHash: txn.hash } });

        await txn.wait();
        dispatch({ type: 'success' });
      } catch (error: any) {
        dispatch({ type: 'error', payload: { error } });
        throw error;
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
};
