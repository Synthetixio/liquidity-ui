import { contractsHash, stringToHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { erc7412Call } from '@snx-v3/withERC7412';
import { Wei, wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export type AccountCollateralType = {
  tokenAddress: string;
  availableCollateral: Wei;
  totalAssigned: Wei;
  totalDeposited: Wei;
  totalLocked: Wei;
  symbol: string;
  displaySymbol: string;
};

export const loadAccountCollateral = async ({
  accountId,
  tokenAddresses,
  provider,
  CoreProxy,
}: {
  accountId: string;
  tokenAddresses: string[];
  provider: ethers.providers.BaseProvider;
  CoreProxy: { address: string; abi: string[] };
}) => {
  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

  const callsP = tokenAddresses.flatMap((tokenAddress) => [
    CoreProxyContract.populateTransaction.getAccountAvailableCollateral(accountId, tokenAddress),
    CoreProxyContract.populateTransaction.getAccountCollateral(accountId, tokenAddress),
  ]);
  const calls = await Promise.all(callsP);
  const decoder = (multicallEncoded: string | string[]) => {
    if (!Array.isArray(multicallEncoded)) throw Error('Expected array');
    return tokenAddresses.map((tokenAddress, i) => {
      const [availableCollateral] = CoreProxyContract.interface.decodeFunctionResult(
        'getAccountAvailableCollateral',
        multicallEncoded[i * 2]
      );
      const { totalAssigned, totalDeposited, totalLocked } =
        CoreProxyContract.interface.decodeFunctionResult(
          'getAccountCollateral',
          multicallEncoded[i * 2 + 1]
        );

      return {
        tokenAddress,
        availableCollateral: wei(availableCollateral),
        totalAssigned: wei(totalAssigned),
        totalDeposited: wei(totalDeposited),
        totalLocked: wei(totalLocked),
        symbol: '',
        displaySymbol: '',
        decimals: 18,
      };
    });
  };
  return { decoder, calls };
};

export function useAccountCollaterals({ accountId }: { accountId?: string }) {
  const { data: CoreProxy } = useCoreProxy();
  const { network } = useNetwork();
  const { data: collateralTypes } = useCollateralTypes();

  const provider = useProvider();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const { data: systemToken } = useSystemToken();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'AccountCollateral',
      { accountId },
      {
        contractsHash: contractsHash([CoreProxy, systemToken]),
        priceUpdateTx: stringToHash(priceUpdateTx?.data),
      },
    ],
    enabled: Boolean(
      network &&
        provider &&
        CoreProxy &&
        accountId &&
        collateralTypes &&
        collateralTypes.length > 0 &&
        systemToken
    ),
    queryFn: async function () {
      if (
        !(
          network &&
          provider &&
          CoreProxy &&
          accountId &&
          collateralTypes &&
          collateralTypes.length > 0 &&
          systemToken
        )
      )
        throw 'OMFG';

      const tokenAddresses = collateralTypes
        .map((c) => c.tokenAddress)
        .concat([systemToken.address]);

      const { calls, decoder } = await loadAccountCollateral({
        accountId,
        tokenAddresses,
        provider,
        CoreProxy,
      });
      const allCalls = [...calls];
      if (priceUpdateTx) {
        allCalls.unshift(priceUpdateTx as any);
      }
      const data = await erc7412Call(network, provider, allCalls, decoder, 'useAccountCollateral');

      return data.map((x) => {
        if (`${systemToken.address}`.toLowerCase() === `${x.tokenAddress}`.toLowerCase()) {
          return Object.assign(x, {
            symbol: systemToken.symbol,
            displaySymbol: systemToken.name,
            decimals: systemToken.decimals,
          });
        }
        const collateralType = collateralTypes.find(
          (c) => `${c.tokenAddress}`.toLowerCase() === `${x.tokenAddress}`.toLowerCase()
        );
        return Object.assign(x, {
          symbol: collateralType?.symbol ?? '',
          displaySymbol: collateralType?.displaySymbol ?? '',
          decimals: collateralType?.decimals ?? 18,
        });
      });
    },
  });
}

export function useAccountCollateral(accountId?: string, collateralAddress?: string) {
  const { network } = useNetwork();
  const { data: accountCollaterals, isPending: isPendingAccountCollaterals } =
    useAccountCollaterals({ accountId });

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'AccountSpecificCollateral',
      { accountId },
      { token: collateralAddress },
      { isPendingAccountCollaterals },
    ],
    enabled: Boolean(accountId && collateralAddress && accountCollaterals),
    queryFn: async function () {
      if (!(accountId && collateralAddress && accountCollaterals)) throw 'OMFG';
      const accountCollateral = accountCollaterals.find(
        ({ tokenAddress }) =>
          `${tokenAddress}`.toLowerCase() === `${collateralAddress}`.toLowerCase()
      );

      return accountCollateral || null;
    },
  });
}
