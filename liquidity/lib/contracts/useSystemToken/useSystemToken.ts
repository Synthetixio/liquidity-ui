import { tokenOverrides } from '@snx-v3/constants';
import { importSystemToken } from '@snx-v3/contracts';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useSystemToken(customNetwork?: Network) {
  const { network: currentNetwork } = useNetwork();
  const network = customNetwork || currentNetwork;

  return useQuery({
    queryKey: [`${network?.id}-${network?.preset}`, 'SystemToken'],
    enabled: Boolean(network),
    queryFn: async function (): Promise<{
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      displaySymbol: string;
    }> {
      if (!network) throw new Error('OMFG');
      const systemToken = await importSystemToken(network.id, network.preset);
      return {
        ...systemToken,
        displaySymbol:
          tokenOverrides[`${network.id}-${network.preset}`]?.[systemToken.address]?.displaySymbol ??
          systemToken.symbol,
      };
    },
    staleTime: Infinity,
    // On some chains this is not available, and that is expected
    throwOnError: false,
  });
}
