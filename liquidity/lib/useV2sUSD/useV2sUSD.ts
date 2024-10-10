import { useQuery } from '@tanstack/react-query';
import { Network } from '@snx-v3/useBlockchain';
import { useV2xSynthetix } from '@snx-v3/useV2xSynthetix';
import { utils } from 'ethers';

export function useV2sUSD(network: Network) {
  const { data: v2xSynthetix } = useV2xSynthetix(network);

  return useQuery({
    queryKey: [`${network?.id}-${network?.preset}`, 'v2-sUSD'],
    queryFn: async function () {
      if (!v2xSynthetix) {
        return;
      }
      return (await v2xSynthetix.synths(utils.formatBytes32String('sUSD'))) as string;
    },
    enabled: Boolean(v2xSynthetix),
  });
}
