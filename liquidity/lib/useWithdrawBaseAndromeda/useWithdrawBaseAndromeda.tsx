import { ZEROWEI } from '@snx-v3/constants';
import { getSpotMarketId, STATA_BASE_MARKET, USDC_BASE_MARKET } from '@snx-v3/isBaseAndromeda';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useGetUSDTokens } from '@snx-v3/useGetUSDTokens';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useUSDProxy } from '@snx-v3/useUSDProxy';
import { withERC7412 } from '@snx-v3/withERC7412';
import { Wei } from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useReducer } from 'react';

const log = debug('snx:useWithdrawBaseAndromeda');

export const useWithdrawBaseAndromeda = ({ amountToWithdraw }: { amountToWithdraw: Wei }) => {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const accountId = params.accountId;

  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: USDProxy } = useUSDProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();
  const { network } = useNetwork();
  const { data: usdTokens } = useGetUSDTokens();

  const { gasSpeed } = useGasSpeed();
  const signer = useSigner();
  const provider = useProvider();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');
      if (
        !(
          CoreProxy &&
          SpotMarketProxy &&
          USDProxy &&
          accountId &&
          usdTokens?.sUSD &&
          usdTokens.snxUSD &&
          params.collateralSymbol &&
          collateralType &&
          liquidityPosition
        )
      ) {
        throw new Error('Not ready');
      }

      const total = liquidityPosition.availableSystemToken.add(
        liquidityPosition.availableCollateral
      );
      log('total', total);

      log('amountToWithdraw', amountToWithdraw);
      if (total.lt(amountToWithdraw)) {
        throw new Error('Exceeds balance');
      }

      const wrappedCollateralAmount = amountToWithdraw.gt(liquidityPosition.availableCollateral)
        ? liquidityPosition.availableCollateral
        : amountToWithdraw;
      log('wrappedCollateralAmount', wrappedCollateralAmount);

      const snxUSDAmount = amountToWithdraw.sub(wrappedCollateralAmount).gt(0)
        ? amountToWithdraw.sub(wrappedCollateralAmount)
        : ZEROWEI;

      log('snxUSDAmount', snxUSDAmount);

      let sUSDC_amount = ZEROWEI;

      const spotMarketId = getSpotMarketId(params.collateralSymbol);
      log('spotMarketId', spotMarketId);

      if (spotMarketId === USDC_BASE_MARKET) {
        sUSDC_amount = sUSDC_amount.add(wrappedCollateralAmount);
      }
      log('sUSDC_amount', sUSDC_amount);

      dispatch({ type: 'prompting' });

      const gasPricesPromised = getGasPrice({ provider });

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
      const USDProxyContract = new ethers.Contract(USDProxy.address, USDProxy.abi, signer);
      const SpotProxyContract = new ethers.Contract(
        SpotMarketProxy.address,
        SpotMarketProxy.abi,
        signer
      );

      const withdraw_collateral = wrappedCollateralAmount.gt(0)
        ? CoreProxyContract.populateTransaction.withdraw(
            ethers.BigNumber.from(accountId),
            collateralType.tokenAddress,
            wrappedCollateralAmount.toBN()
          )
        : undefined;

      //snxUSD
      const withdraw_snxUSD = snxUSDAmount.gt(0)
        ? CoreProxyContract.populateTransaction.withdraw(
            ethers.BigNumber.from(accountId),
            usdTokens?.snxUSD,
            snxUSDAmount.toBN()
          )
        : undefined;

      const snxUSDApproval = snxUSDAmount.gt(0)
        ? USDProxyContract.populateTransaction.approve(SpotMarketProxy.address, snxUSDAmount.toBN())
        : undefined;

      //snxUSD => sUSDC
      const buy_sUSDC = snxUSDAmount.gt(0)
        ? SpotProxyContract.populateTransaction.buy(
            USDC_BASE_MARKET,
            snxUSDAmount.toBN(),
            0,
            ethers.constants.AddressZero
          )
        : undefined;

      const synthAmount = snxUSDAmount.gt(0)
        ? (
            await SpotProxyContract.callStatic.quoteBuyExactIn(
              USDC_BASE_MARKET,
              snxUSDAmount.toBN(),
              0
            )
          ).synthAmount
        : ZEROWEI;
      const unwrapAmount = sUSDC_amount.add(synthAmount);

      //sUSDC => USDC
      const unwrapTxnPromised = unwrapAmount.gt(0)
        ? SpotProxyContract.populateTransaction.unwrap(USDC_BASE_MARKET, unwrapAmount.toBN(), 0)
        : undefined;

      const unwrapCollateralTxnPromised =
        spotMarketId === STATA_BASE_MARKET && wrappedCollateralAmount.gt(0)
          ? SpotProxyContract.populateTransaction.unwrap(
              STATA_BASE_MARKET,
              wrappedCollateralAmount.toBN(),
              0
            )
          : undefined;

      const [
        gasPrices,
        withdraw_collateral_txn,
        withdraw_snxUSD_txn,
        snxUSDApproval_txn,
        buy_sUSDC_txn,
        unwrapTxnPromised_txn,
        unwrapCollateralTxnPromised_txn,
      ] = await Promise.all([
        gasPricesPromised,
        withdraw_collateral,
        withdraw_snxUSD,
        snxUSDApproval,
        buy_sUSDC,
        unwrapTxnPromised,
        unwrapCollateralTxnPromised,
      ]);

      const allCalls = [
        withdraw_collateral_txn,
        withdraw_snxUSD_txn,
        snxUSDApproval_txn,
        buy_sUSDC_txn,
        unwrapTxnPromised_txn,
        unwrapCollateralTxnPromised_txn,
      ].filter(notNil);

      if (priceUpdateTx) {
        allCalls.unshift(priceUpdateTx as any);
      }

      const walletAddress = await signer.getAddress();
      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        allCalls,
        'useWithdrawBase',
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

    onSuccess: async () => {
      const deployment = `${network?.id}-${network?.preset}`;
      await Promise.all(
        [
          //
          'PriceUpdates',
          'LiquidityPosition',
          'LiquidityPositions',
          'TokenBalance',
          'SynthBalances',
          'EthBalance',
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
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
};
