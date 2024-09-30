import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { useStataUSDC } from '@snx-v3/useStataUSDC/useStataUSDC';
import Wei from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';

export function useStataUSDCRate(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const { data: stataUSDC } = useStataUSDC();

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'stataUSDCRate'],
    queryFn: async () => {
      const rate = await stataUSDC?.rate();
      return new Wei(rate);
    },
    enabled: Boolean(isBaseAndromeda(network?.id, network?.preset) && stataUSDC),
    staleTime: Infinity,
  });
}
