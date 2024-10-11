import { importPythFeeds } from '@snx-v3/contracts';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function usePythFeeds(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'PythFeeds'],
    enabled: Boolean(targetNetwork),
    queryFn: async function () {
      if (!targetNetwork) {
        throw new Error('OMFG');
      }
      return await importPythFeeds(targetNetwork.id, targetNetwork.preset);
    },
    staleTime: Infinity,
  });
}
