import { getAprUrl } from '@snx-v3/constants';
import { ARBITRUM, BASE_ANDROMEDA, MAINNET, Network, useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export type PositionAPR = {
  poolId: number;
  collateralType: string;
  apr28d: number;
  apr28dPnl: number;
  apr28dRewards: number;
  apr28dPerformance: number;
  apr24hIncentiveRewards: number;
};

const supportedAprNetworks = [BASE_ANDROMEDA.id, ARBITRUM.id, MAINNET.id];

export async function fetchApr(networkId?: number) {
  try {
    const isSupported = networkId && supportedAprNetworks.includes(networkId);
    if (!isSupported) {
      throw new Error(`APR endpoint not supported for network ${networkId}`);
    }
    const response = await fetch(getAprUrl(networkId));
    const data: PositionAPR[] = await response.json();

    // Math.max(...data.map(({ apr28d }: { apr28d: number }) => apr28d)) * 100
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function useApr(customNetwork?: Network) {
  const { network } = useNetwork();
  const chain = customNetwork || network;

  return useQuery({
    queryKey: ['apr', chain?.id],
    queryFn: async () => {
      try {
        return await fetchApr(chain?.id);
      } catch (error) {
        return;
      }
    },
    staleTime: 60000,
    enabled: Boolean(chain?.id),
  });
}
