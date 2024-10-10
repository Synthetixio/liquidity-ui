import { Contract } from '@ethersproject/contracts';
import { importV2x } from '@snx-v3/contracts';
import { Network, useProviderForChain } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useV2xSynthetix(network: Network) {
  const provider = useProviderForChain(network);

  return useQuery({
    queryKey: [`${network.id}-${network.preset}`, 'V2xSynthetix'],
    enabled: Boolean(provider),
    queryFn: async function () {
      if (!provider) throw new Error('OMFG');

      const { address, abi } = await importV2x(network?.id, network?.preset);
      return new Contract(address, abi, provider);
    },
    staleTime: Infinity,
  });
}
