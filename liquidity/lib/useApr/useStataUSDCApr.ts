import { calculateCompoundedRate } from '@aave/math-utils';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { useQuery } from '@tanstack/react-query';

export function useStataUSDCApr(networkId?: number, preset?: string) {
  return useQuery({
    enabled: isBaseAndromeda(networkId, preset),
    queryKey: ['useStataUSDCAPR', networkId],
    queryFn: async () => {
      const subgraphResponse = await fetch(
        'https://gateway.thegraph.com/api/f55095f3203bcba72cbee045322be46c/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        }
      );

      const data = await subgraphResponse.json();
      const stataStats = data.data.reserves.filter(
        (reserve: Record<string, string>) =>
          reserve.underlyingAsset === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
      )[0];
      try {
        return Number(
          calculateCompoundedRate({
            rate: stataStats.liquidityRate,
            duration: 31536000, // seconds per year
          })
            .toNumber()
            .toPrecision(2)
            .split('e')[0]
        );
      } catch (_) {
        return 0;
      }
    },
  });
}

const query = `
  query {
  reserves {
    underlyingAsset
    liquidityRate
    }
  }
`;
