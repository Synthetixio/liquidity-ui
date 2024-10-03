import { Contract } from '@ethersproject/contracts';
import { importMulticall3 } from '@snx-v3/contracts';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useMulticall3(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const provider = useProviderForChain(targetNetwork);

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'Multicall3'],
    enabled: Boolean(provider && targetNetwork),
    queryFn: async function () {
      if (!(provider && targetNetwork)) throw new Error('OMFG');

      const { address, abi } = await importMulticall3(targetNetwork.id, targetNetwork.preset);
      return new Contract(address, abi, provider);
    },
    staleTime: Infinity,
  });
}
