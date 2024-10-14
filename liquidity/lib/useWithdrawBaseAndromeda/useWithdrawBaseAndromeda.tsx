import { ZEROWEI } from '@snx-v3/constants';
import { getSpotMarketId } from '@snx-v3/isBaseAndromeda';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { AccountCollateralType } from '@snx-v3/useAccountCollateral';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useGetUSDTokens } from '@snx-v3/useGetUSDTokens';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useUSDProxy } from '@snx-v3/useUSDProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import { Wei } from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useReducer } from 'react';

export const useWithdrawBaseAndromeda = ({
  accountId,
  availableCollateral,
  snxUSDCollateral,
  amountToWithdraw,
  accountCollateral,
  collateralSymbol,
}: {
  availableCollateral: Wei;
  snxUSDCollateral: Wei;
  amountToWithdraw: Wei;
  accountId?: string;
  collateralSymbol?: string;
  accountCollateral: AccountCollateralType | undefined;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotProxy } = useSpotMarketProxy();
  const { data: USDProxy } = useUSDProxy();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();
  const { network } = useNetwork();
  const { data: usdTokens } = useGetUSDTokens();

  const { gasSpeed } = useGasSpeed();
  const signer = useSigner();
  const provider = useProvider();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');
      if (
        !(CoreProxy && SpotProxy && USDProxy && accountId && usdTokens?.sUSD && usdTokens.snxUSD)
      ) {
        throw new Error('Not ready');
      }

      const total = snxUSDCollateral.add(availableCollateral);

      if (total.lt(amountToWithdraw)) {
        throw new Error('Exceeds balance');
      }

      const wrappedCollateralAmount = amountToWithdraw.gt(availableCollateral)
        ? availableCollateral
        : amountToWithdraw;

      const snxUSDAmount = amountToWithdraw.sub(wrappedCollateralAmount).gt(0)
        ? amountToWithdraw.sub(wrappedCollateralAmount)
        : ZEROWEI;

      try {
        const spotMarketId = getSpotMarketId(collateralSymbol);

        dispatch({ type: 'prompting' });

        const gasPricesPromised = getGasPrice({ provider });

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
        const USDProxyContract = new ethers.Contract(USDProxy.address, USDProxy.abi, signer);
        const SpotProxyContract = new ethers.Contract(SpotProxy.address, SpotProxy.abi, signer);

        const withdraw_collateral = wrappedCollateralAmount.gt(0)
          ? CoreProxyContract.populateTransaction.withdraw(
              ethers.BigNumber.from(accountId),
              accountCollateral?.tokenAddress,
              wrappedCollateralAmount.toBN()
            )
          : undefined;

        const withdraw_snxUSD = snxUSDAmount.gt(0)
          ? CoreProxyContract.populateTransaction.withdraw(
              ethers.BigNumber.from(accountId),
              usdTokens?.snxUSD,
              snxUSDAmount.toBN()
            )
          : undefined;

        const snxUSDApproval = snxUSDAmount.gt(0)
          ? USDProxyContract.populateTransaction.approve(SpotProxy.address, snxUSDAmount.toBN())
          : undefined;
        const buy_wrappedCollateral = snxUSDAmount.gt(0)
          ? SpotProxyContract.populateTransaction.buy(
              spotMarketId,
              snxUSDAmount.toBN(),
              0,
              ethers.constants.AddressZero
            )
          : undefined;

        const synthAmount = snxUSDAmount.gt(0)
          ? (
              await SpotProxyContract.callStatic.quoteBuyExactIn(
                spotMarketId,
                snxUSDAmount.toBN(),
                0
              )
            ).synthAmount
          : ZEROWEI;
        const withdrawAmount = availableCollateral.add(synthAmount);

        const unwrapTxnPromised = SpotProxyContract.populateTransaction.unwrap(
          spotMarketId,
          withdrawAmount.toBN(),
          // 2% slippage
          Number(
            ethers.utils
              .formatUnits(withdrawAmount.toBN().mul(98).div(100).toString(), 12)
              .toString()
          ).toFixed()
        );

        const [
          gasPrices,
          withdraw_collateral_txn,
          withdraw_snxUSD_txn,
          snxUSDApproval_txn,
          buy_wrappedCollateral_txn,
          unwrapTxnPromised_txn,
        ] = await Promise.all([
          gasPricesPromised,
          withdraw_collateral,
          withdraw_snxUSD,
          snxUSDApproval,
          buy_wrappedCollateral,
          unwrapTxnPromised,
        ]);

        const allCalls = [
          withdraw_collateral_txn,
          withdraw_snxUSD_txn,
          snxUSDApproval_txn,
          buy_wrappedCollateral_txn,
          unwrapTxnPromised_txn,
        ].filter(notNil);

        if (priceUpdateTx) {
          allCalls.unshift(priceUpdateTx as any);
        }

        const walletAddress = await signer.getAddress();
        const erc7412Tx = await withERC7412(network, allCalls, 'useWithdrawBase', walletAddress);

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
