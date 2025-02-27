import { useQuery } from '@tanstack/react-query';
import { fetchPythPrice } from '@snx-v3/usePythPrice';
import { wei } from '@synthetixio/wei';

export async function fetchTvl() {
  const response = await fetch('https://api.synthetix.io/v3/tvl');
  const { tvl } = await response.json();
  return tvl;
}

export async function fetchV2xStakedSNX() {
  const response = await fetch('https://api.synthetix.io/staking-ratio');
  const {
    stakedSnx: { ethereum, optimism },
  } = await response.json();
  return ethereum + optimism;
}

export function useTvl() {
  return useQuery({
    queryKey: ['tvl'],
    queryFn: async () => {
      const [v3Tvl, snxPrice, v2xStakedSNX] = await Promise.all([
        fetchTvl(),
        fetchPythPrice('SNX'),
        fetchV2xStakedSNX(),
      ]);
      if (!snxPrice) {
        throw new Error('SNX price not found');
      }
      return v3Tvl + wei(snxPrice).mul(v2xStakedSNX).toNumber();
    },
    staleTime: 600_000,
  });
}
