import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { ZodBigNumber } from '@snx-v3/zod';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { z } from 'zod';

export const PoolIdSchema = ZodBigNumber.transform((x) => x.toString());

export const PoolSchema = z.object({
  id: PoolIdSchema,
  name: z.string().default('Unnamed Pool'),
  isPreferred: z.boolean(),
});

export const PoolsSchema = z.array(PoolSchema);

export function usePools(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;

  const { data: CoreProxy } = useCoreProxy(targetNetwork);

  return useQuery({
    enabled: Boolean(targetNetwork),
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, CoreProxy?.address, 'Pools'],
    queryFn: async () => {
      if (!CoreProxy) {
        throw 'usePools is missing required data';
      }

      const [prefferedPoolId, approvedPoolIds] = await Promise.all([
        CoreProxy.callStatic.getPreferredPool(),
        CoreProxy.callStatic.getApprovedPools(),
      ]);

      const incompletePools = [
        {
          id: prefferedPoolId,
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

      const poolsRaw = incompletePools.map(({ id, isPreferred }, i) => ({
        id,
        isPreferred,
        name: poolNames[i],
      }));

      return PoolsSchema.parse(poolsRaw);
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
