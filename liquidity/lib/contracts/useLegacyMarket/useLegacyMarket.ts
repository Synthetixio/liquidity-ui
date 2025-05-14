import { importLegacyMarket } from '@snx-v3/contracts';
import { type Network, useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useLegacyMarket(customNetwork?: Network) {
  const { network: currentNetwork } = useNetwork();
  const network = customNetwork ?? currentNetwork;

  return useQuery({
    queryKey: [`${network?.id}-${network?.preset}`, 'LegacyMarket'],
    enabled: Boolean(network),
    queryFn: async () => {
      if (!network) {
        throw new Error('OMFG');
      }
      return importLegacyMarket(network.id, network.preset);
    },
    staleTime: Number.POSITIVE_INFINITY,
    // On some chains this is not available, and that is expected
    throwOnError: false,
  });
}
