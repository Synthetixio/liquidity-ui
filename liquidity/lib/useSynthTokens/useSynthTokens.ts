import { useQuery } from '@tanstack/react-query';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { importSynthTokens } from '@snx-v3/contracts';

export function useSynthTokens(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'SynthTokens'],
    queryFn: () => importSynthTokens(targetNetwork?.id, targetNetwork?.preset),
    enabled: Boolean(targetNetwork),
    staleTime: Infinity,
  });
}
