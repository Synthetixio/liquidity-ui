import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchAccountCollateral } from './fetchAccountCollateral';
import { fetchAccountCollateralWithPriceUpdate } from './fetchAccountCollateralWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';

const log = debug('snx:useAccountCollateral');

export function useAccountCollateral({
  provider,
  accountId,
  collateralTypeTokenAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  accountId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: CoreProxy } = useCoreProxy();
  const { data: Multicall3 } = useMulticall3();

  const { data: priceUpdateTxn } = usePriceUpdateTxn();

  return useQuery({
    enabled: Boolean(
      chainId &&
        preset &&
        provider &&
        CoreProxy?.address &&
        Multicall3?.address &&
        accountId &&
        collateralTypeTokenAddress &&
        priceUpdateTxn
    ),
    queryKey: [
      chainId,
      preset,
      'AccountCollateral',
      { CoreProxy: CoreProxy?.address, Multicall: Multicall3?.address },
      {
        accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined,
        collateralTypeTokenAddress,
      },
    ],
    queryFn: async () => {
      if (
        !(
          chainId &&
          preset &&
          provider &&
          CoreProxy?.address &&
          Multicall3?.address &&
          accountId &&
          collateralTypeTokenAddress &&
          priceUpdateTxn
        )
      ) {
        throw 'OMFG';
      }

      log({
        chainId,
        preset,
        CoreProxyContract: CoreProxy,
        MulticallContract: Multicall3,
        accountId,
        collateralTypeTokenAddress,
        priceUpdateTxn,
      });

      if (priceUpdateTxn.value) {
        log('-> fetchAccountCollateralWithPriceUpdate');
        return fetchAccountCollateralWithPriceUpdate({
          provider,
          CoreProxyContract: CoreProxy,
          MulticallContract: Multicall3,
          accountId,
          collateralTypeTokenAddress,
          priceUpdateTxn,
        });
      }

      log('-> fetchAccountCollateral');
      return fetchAccountCollateral({
        provider,
        CoreProxyContract: CoreProxy,
        accountId,
        collateralTypeTokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountCollateral) => ({
      totalAssigned: ethers.BigNumber.from(accountCollateral.totalAssigned),
      totalDeposited: ethers.BigNumber.from(accountCollateral.totalDeposited),
      totalLocked: ethers.BigNumber.from(accountCollateral.totalLocked),
    }),
    retry: 5,
    retryDelay: (attempt) => 2 ** attempt * 1000,
  });
}
