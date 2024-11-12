import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchPositionDebt } from './fetchPositionDebt';
import { fetchPositionDebtWithPriceUpdate } from './fetchPositionDebtWithPriceUpdate';
import { useErrorParser } from './useErrorParser';
import { usePriceUpdateTxn } from './usePriceUpdateTxn';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePositionDebt');

export function usePositionDebt({
  provider,
  accountId,
  poolId,
  collateralTypeTokenAddress,
}: {
  provider?: ethers.providers.BaseProvider;
  accountId?: ethers.BigNumberish;
  poolId?: ethers.BigNumberish;
  collateralTypeTokenAddress?: string;
}) {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();

  const { data: priceUpdateTxn } = usePriceUpdateTxn();

  const { data: CoreProxy } = useCoreProxy();
  const { data: Multicall3 } = useMulticall3();

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(
      chainId &&
        preset &&
        provider &&
        CoreProxy?.address &&
        Multicall3?.address &&
        accountId &&
        poolId &&
        collateralTypeTokenAddress
    ),
    queryKey: [
      chainId,
      preset,
      'PositionDebt',
      { CoreProxy: CoreProxy?.address, Multicall: Multicall3?.address },
      {
        accountId: accountId ? ethers.BigNumber.from(accountId).toHexString() : undefined,
        collateralTypeTokenAddress,
        priceUpdateTxn: priceUpdateTxn?.callData,
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
          poolId &&
          collateralTypeTokenAddress
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
        poolId,
        collateralTypeTokenAddress,
        priceUpdateTxn,
      });

      if (priceUpdateTxn?.value) {
        log('-> fetchPositionDebtWithPriceUpdate');
        return fetchPositionDebtWithPriceUpdate({
          provider,
          CoreProxy,
          Multicall3,
          accountId,
          poolId,
          collateralTypeTokenAddress,
          priceUpdateTxn,
        });
      }
      log('-> fetchPositionDebt');
      return fetchPositionDebt({
        provider,
        CoreProxy,
        accountId,
        poolId,
        collateralTypeTokenAddress,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (positionDebt) => ethers.BigNumber.from(positionDebt),
    retry: 5,
    retryDelay: (attempt) => 2 ** attempt * 1000,
  });
}
