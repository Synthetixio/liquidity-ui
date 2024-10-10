import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function usePools(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const { data: CoreProxy } = useCoreProxy(targetNetwork);

  return useQuery({
    enabled: Boolean(CoreProxy),
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'Pools',
      { CoreProxy: CoreProxy?.address },
    ],
    queryFn: async () => {
      if (!CoreProxy) throw 'OMFG';

      const [preferredPoolId, approvedPoolIds] = await Promise.all([
        CoreProxy.callStatic.getPreferredPool(),
        CoreProxy.callStatic.getApprovedPools(),
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
        incompletePools.map(async ({ id }) => await CoreProxy.getPoolName(id))
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
  const { isFetching, error, data } = usePools(customNetwork);

  return {
    isLoading: isFetching,
    error,
    data: data?.find((item) => item.id === poolId),
  };
}
