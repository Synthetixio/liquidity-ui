import { contractsHash } from '@snx-v3/tsHelpers';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useStaticAaveUSDCRate(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const { data: StaticAaveUSDC } = useStaticAaveUSDC(targetNetwork);
  const provider = useProviderForChain(targetNetwork);
  return useQuery({
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'StaticAaveUSDC Rate',
      { contractsHash: contractsHash([StaticAaveUSDC]) },
    ],
    enabled: Boolean(provider && StaticAaveUSDC),
    queryFn: async function () {
      if (!(provider && StaticAaveUSDC)) throw new Error('OMFG');
      const StaticAaveUSDCContract = new ethers.Contract(
        StaticAaveUSDC.address,
        StaticAaveUSDC.abi,
        provider
      );
      const rate = await StaticAaveUSDCContract.rate();
      return rate;
    },
    select: (rate) => wei(rate, 27), // why 27 :facepalm:
  });
}
