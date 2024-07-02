import { importExtras } from '@snx-v3/contracts';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useAllPriceFeeds(customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  return useQuery({
    enabled: Boolean(targetNetwork?.id && targetNetwork?.preset),
    queryKey: [targetNetwork?.id, 'AllPriceFeeds'],
    queryFn: async () => {
      if (!(targetNetwork?.id && targetNetwork?.preset)) {
        throw 'OMFG';
      }
      const extras = await importExtras(targetNetwork.id, targetNetwork.preset);
      return Object.entries(extras)
        .filter(
          ([key, value]) =>
            String(value).length === 66 &&
            (key.startsWith('pyth_feed_id_') || (key.startsWith('pyth') && key.endsWith('FeedId')))
        )
        .map(([, value]) => value);
    },
    staleTime: 60 * 60 * 1000,
  });
}
