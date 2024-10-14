import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useAccountCollateralUnlockDate({ accountId }: { accountId?: string }) {
  const { data: CoreProxy } = useCoreProxy();
  const { network } = useNetwork();
  const provider = useProvider();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'AccountCollateralUnlockDate',
      { accountId },
      { contractsHash: contractsHash([CoreProxy]) },
    ],
    enabled: Boolean(provider && CoreProxy && accountId),
    queryFn: async function () {
      if (!(provider && CoreProxy && accountId)) throw 'OMFG';
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
      const [lastInteraction, accountTimeoutWithdraw] = await Promise.all([
        CoreProxyContract.getAccountLastInteraction(accountId),
        CoreProxyContract.getConfigUint(ethers.utils.formatBytes32String('accountTimeoutWithdraw')),
      ]);
      const collateralUnlock = lastInteraction.add(accountTimeoutWithdraw);
      return new Date(collateralUnlock.toNumber() * 1000);
    },
  });
}
