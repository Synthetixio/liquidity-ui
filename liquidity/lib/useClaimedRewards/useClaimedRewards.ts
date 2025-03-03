import { getClaimedRewardsURL } from '@snx-v3/constants';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export type ClaimedReward = {
  ts: string;
  pool_id: number;
  collateral_type: string;
  account_id: string;
  reward_type: string;
  distributor: string;
  token_symbol: string;
  amount: string;
  price: string;
  amount_usd: string;
};

export function useClaimedRewards(accountId: string | undefined) {
  const { network } = useNetwork();

  return useQuery({
    queryKey: ['claimed-rewards', network?.id, accountId],
    queryFn: async () => {
      try {
        const response = await fetch(getClaimedRewardsURL(network?.id) + `?accountId=${accountId}`);
        const data: ClaimedReward[] = await response.json();

        return data;
      } catch (error) {
        return;
      }
    },
    staleTime: 600000,
    enabled: Boolean(network?.id && accountId),
  });
}
