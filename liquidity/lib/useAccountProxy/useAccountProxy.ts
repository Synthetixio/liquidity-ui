import { Contract } from '@ethersproject/contracts';
import { importAccountProxy } from '@snx-v3/contracts';
import { useDefaultProvider, useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useAccountProxy() {
  const { network } = useNetwork();
  const provider = useDefaultProvider();

  return useQuery({
    queryKey: [`${network?.id}-${network?.preset}`, 'AccountProxy'],
    enabled: Boolean(provider && network),
    queryFn: async function () {
      if (!(provider && network)) throw new Error('OMFG');
      const { address, abi } = await importAccountProxy(network.id, network?.preset);
      return new Contract(address, abi, provider);
    },
    staleTime: Infinity,
  });
}
