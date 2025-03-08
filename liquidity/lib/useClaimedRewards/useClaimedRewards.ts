import { getClaimedRewardsURL } from '@snx-v3/constants';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';

const log = debug('snx:useClaimedRewards');

export function useClaimedRewards(accountId?: string) {
  const { network } = useNetwork();

  return useQuery({
    queryKey: [`${network?.id}-${network?.preset}`, 'ClaimedRewards', { accountId }],
    enabled: Boolean(network && accountId),
    queryFn: async () => {
      const response = await fetch(getClaimedRewardsURL(network?.id) + `?accountId=${accountId}`);
      const claimedRewards: { total_amount_usd: string; collateral_type: string }[] =
        await response.json();
      log('claimedRewards', claimedRewards);
      return claimedRewards;
    },
    staleTime: 60_000,
  });
}
