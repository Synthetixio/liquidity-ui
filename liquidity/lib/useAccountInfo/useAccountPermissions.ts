import { contractsHash } from '@snx-v3/tsHelpers';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useAccountPermissions(accountId?: ethers.BigNumber) {
  const { data: CoreProxy } = useCoreProxy();
  const { network } = useNetwork();
  const provider = useProvider();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'AccountPermissions',
      { accountId },
      { contractsHash: contractsHash([CoreProxy]) },
    ],
    enabled: Boolean(provider && CoreProxy && accountId),
    queryFn: async function () {
      if (!(provider && CoreProxy && accountId)) throw 'OMFG';
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
      const permissions = await CoreProxyContract.getAccountPermissions(accountId);
      return permissions.reduce(
        (
          acc: { [key: string]: string[] },
          { user, permissions }: { user: string; permissions: string[] }
        ) => ({
          ...acc,
          [user.toLowerCase()]: permissions.map((r: string) => ethers.utils.parseBytes32String(r)),
        }),
        {}
      );
    },
  });
}

export function useAccountOwner(accountId?: ethers.BigNumber) {
  const { data: AccountProxy } = useAccountProxy();
  const { network } = useNetwork();
  const provider = useProvider();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'AccountOwner',
      { accountId },
      { contractsHash: contractsHash([AccountProxy]) },
    ],
    enabled: Boolean(provider && AccountProxy && accountId),
    queryFn: async function () {
      if (!(provider && AccountProxy && accountId)) throw 'OMFG';
      const AccountProxyContract = new ethers.Contract(
        AccountProxy.address,
        AccountProxy.abi,
        provider
      );
      return (await AccountProxyContract.ownerOf(accountId)) as string;
    },
  });
}
