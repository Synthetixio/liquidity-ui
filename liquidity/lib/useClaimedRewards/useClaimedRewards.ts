import { getClaimedRewardsURL } from '@snx-v3/constants';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useClaimedRewards(accountId: string | undefined) {
  const { network } = useNetwork();

  return useQuery({
    queryKey: ['claimed-reward', network?.id, accountId],
    queryFn: async () => {
      try {
        const response = await fetch(getClaimedRewardsURL(network?.id) + `?accountId=${accountId}`);
        const totalAmountUsd: string = await response.json();

        return totalAmountUsd;
      } catch (error) {
        return;
      }
    },
    staleTime: 300_000,
    enabled: Boolean(network?.id && accountId),
  });
}
