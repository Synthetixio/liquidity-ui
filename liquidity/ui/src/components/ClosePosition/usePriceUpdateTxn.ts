import { useProvider } from '@snx-v3/useBlockchain';
import { usePythFeeds } from '@snx-v3/usePythFeeds';
import { usePythVerifier } from '@snx-v3/usePythVerifier';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';
import { useErrorParser } from './useErrorParser';
import { useSynthetix } from './useSynthetix';

const log = debug('snx:usePriceUpdateTxn');

export function usePriceUpdateTxn() {
  const { chainId, preset } = useSynthetix();
  const errorParser = useErrorParser();
  const { data: pythFeeds } = usePythFeeds();
  const { data: PythVerfier } = usePythVerifier();
  const provider = useProvider();

  return useQuery({
    enabled: Boolean(chainId && preset && provider && pythFeeds && PythVerfier),
    queryKey: [chainId, preset, 'PriceUpdateTxn'],
    queryFn: async (): Promise<{
      target: string;
      callData: string;
      value: ethers.BigNumber;
      requireSuccess: boolean;
    }> => {
      if (!(chainId && preset && provider && pythFeeds && PythVerfier)) {
        throw 'OMFG';
      }
      log({ chainId, preset, priceIds: pythFeeds, PythVerfier });
      const priceUpdateTxn = await fetchPriceUpdateTxn({ pythFeeds, PythVerfier });
      log('priceUpdateTxn: %O', priceUpdateTxn);
      return priceUpdateTxn;
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },
    // considering real staleness tolerance at 3_600s,
    // refetching price updates every 10m should be way more than enough
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
