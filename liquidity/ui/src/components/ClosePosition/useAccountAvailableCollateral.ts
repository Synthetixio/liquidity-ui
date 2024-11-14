import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchAccountAvailableCollateral } from './fetchAccountAvailableCollateral';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';
import { useCoreProxy } from '@snx-v3/useCoreProxy';

const log = debug('snx:useAccountAvailableCollateral');

export function useAccountAvailableCollateral({
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

  return useQuery<ethers.BigNumber>({
    enabled: Boolean(
      chainId && preset && provider && CoreProxy?.address && accountId && collateralTypeTokenAddress
    ),
    queryKey: [
      chainId,
      preset,
      'AccountAvailableCollateral',
      { CoreProxy: CoreProxy?.address },
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
          accountId &&
          collateralTypeTokenAddress
        )
      ) {
        throw 'OMFG';
      }

      log({ chainId, preset, CoreProxy, accountId, collateralTypeTokenAddress });

      const accountAvailableCollateral = await fetchAccountAvailableCollateral({
        provider,
        CoreProxy,
        accountId,
        collateralTypeTokenAddress,
      });
      log('accountAvailableCollateral: %O', accountAvailableCollateral);
      return accountAvailableCollateral;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    select: (accountAvailableCollateral) => ethers.BigNumber.from(accountAvailableCollateral),
  });
}
