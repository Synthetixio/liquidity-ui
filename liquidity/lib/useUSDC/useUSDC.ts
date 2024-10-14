import { importUSDC } from '@snx-v3/contracts';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useUSDC(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'USDC'],
    enabled: Boolean(targetNetwork),
    queryFn: async function () {
      if (!targetNetwork) throw new Error('OMFG');

      return importUSDC(targetNetwork.id, targetNetwork.preset);
    },
    staleTime: Infinity,
    // On some chains this is not available, and that is expected
    throwOnError: false,
  });
}
