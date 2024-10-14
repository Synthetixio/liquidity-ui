import { contractsHash } from '@snx-v3/tsHelpers';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function usePools(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const { data: CoreProxy } = useCoreProxy(targetNetwork);
  const provider = useProviderForChain(targetNetwork);

  return useQuery({
    enabled: Boolean(provider && CoreProxy),
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'Pools',
      { contractsHash: contractsHash([CoreProxy]) },
    ],
    queryFn: async () => {
      if (!(provider && CoreProxy)) throw 'OMFG';

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const [preferredPoolId, approvedPoolIds] = await Promise.all([
        CoreProxyContract.getPreferredPool(),
        CoreProxyContract.getApprovedPools(),
      ]);

      const incompletePools = [
        {
          id: preferredPoolId,
          isPreferred: true,
        },
      ].concat(
        approvedPoolIds.map((id: ethers.BigNumber) => ({
          id: id,
          isPreferred: false,
        }))
      );

      const poolNames = await Promise.all(
        incompletePools.map(async ({ id }) => await CoreProxyContract.getPoolName(id))
      );

      return incompletePools.map((pool, i) => ({
        id: `${pool.id}`,
        name: poolNames[i] || 'Unnamed Pool',
        isPreferred: pool.isPreferred,
      }));
    },
  });
}

export function usePool(poolId?: string, customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const { data: pools } = usePools(targetNetwork);

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'Pool', { poolId }],
    enabled: Boolean(pools),
    queryFn: () => {
      if (!pools) throw 'OMFG';
      return pools.find((item) => `${item.id}` === `${poolId}`);
    },
  });
}
