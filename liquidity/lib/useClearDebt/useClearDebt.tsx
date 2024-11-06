import { getRepayerContract, USDC_BASE_MARKET } from '@snx-v3/isBaseAndromeda';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useReducer } from 'react';

export const DEBT_REPAYER_ABI = [
  {
    inputs: [
      { internalType: 'contract ISynthetixCore', name: 'synthetixCore', type: 'address' },
      { internalType: 'contract ISpotMarket', name: 'spotMarket', type: 'address' },
      { internalType: 'uint128', name: 'accountId', type: 'uint128' },
      { internalType: 'uint128', name: 'poolId', type: 'uint128' },
      { internalType: 'address', name: 'collateralType', type: 'address' },
      { internalType: 'uint128', name: 'spotMarketId', type: 'uint128' },
    ],
    name: 'depositDebtToRepay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export const useClearDebt = ({
  accountId,
  poolId,
  collateralTypeAddress,
  availableUSDCollateral,
  debt,
}: {
  accountId?: string;
  poolId?: string;
  collateralTypeAddress?: string;
  availableUSDCollateral?: Wei;
  debt?: Wei;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();

  const signer = useSigner();
  const { network } = useNetwork();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');
      if (!(CoreProxy && poolId && accountId && collateralTypeAddress && SpotMarketProxy)) {
        return;
      }

      const Repayer = new ethers.Contract(getRepayerContract(network.id), DEBT_REPAYER_ABI, signer);

      if (!availableUSDCollateral) return;

      try {
        dispatch({ type: 'prompting' });

        const depositDebtToRepay = Repayer.populateTransaction.depositDebtToRepay(
          CoreProxy.address,
          SpotMarketProxy.address,
          accountId,
          poolId,
          collateralTypeAddress,
          USDC_BASE_MARKET
        );

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

        const burn = CoreProxyContract.populateTransaction.burnUsd(
          ethers.BigNumber.from(accountId),
          ethers.BigNumber.from(poolId),
          collateralTypeAddress,
          debt?.mul(110).div(100).toBN().toString() || '0'
        );

        const callsPromise = Promise.all([depositDebtToRepay, burn].filter(notNil));

        const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);

        if (priceUpdateTx) {
          calls.unshift(priceUpdateTx as any);
        }
        const walletAddress = await signer.getAddress();
        const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
          network,
          calls,
          'useRepay',
          walletAddress
        );

        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit,
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
