import { contractsHash } from '@snx-v3/tsHelpers';
import { Network, useProviderForChain } from '@snx-v3/useBlockchain';
import { useV2xSynthetix } from '@snx-v3/useV2xSynthetix';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useV2sUSD(network: Network) {
  const { data: V2xSynthetix } = useV2xSynthetix(network);
  const provider = useProviderForChain(network);

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'V2 sUSD',

      { contractsHash: contractsHash([V2xSynthetix]) },
    ],
    enabled: Boolean(provider && V2xSynthetix),
    queryFn: async function () {
      if (!(provider && V2xSynthetix)) throw 'OMFG';
      const V2xSynthetixContract = new ethers.Contract(
        V2xSynthetix.address,
        V2xSynthetix.abi,
        provider
      );

      return (await V2xSynthetixContract.synths(
        ethers.utils.formatBytes32String('sUSD')
      )) as string;
    },
  });
}
