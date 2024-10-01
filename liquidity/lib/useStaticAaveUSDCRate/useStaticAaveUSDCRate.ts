import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';

export function useStaticAaveUSDCRate(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const { data: StaticAaveUSDC } = useStaticAaveUSDC(customNetwork);
  return useQuery({
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'StaticAaveUSDC Rate',
      { StaticAaveUSDC: StaticAaveUSDC?.address },
    ],
    enabled: Boolean(StaticAaveUSDC),
    queryFn: async function () {
      if (!StaticAaveUSDC) throw new Error('OMFG');
      const rate = await StaticAaveUSDC.rate();
      return rate;
    },
    select: (rate) => wei(rate, 27), // why 27 :facepalm:
    staleTime: Infinity,
  });
}
