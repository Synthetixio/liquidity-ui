import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { offchainMainnetEndpoint } from '@snx-v3/constants';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

const priceService = new EvmPriceServiceConnection(offchainMainnetEndpoint, {
  timeout: 60_000,
  httpRetries: 5,
  verbose: true,
});

const priceFeeds: { [key: string]: string } = {
  SNX: '0x39d020f60982ed892abbcd4a06a276a9f9b7bfbce003204c110b6e488f502da3',
};

export const usePythPrice = (symbol?: string, time?: number) => {
  return useQuery({
    queryKey: ['PythPrice', symbol, { time }],
    enabled: Boolean(symbol),
    queryFn: async () => {
      if (symbol && symbol in priceFeeds) {
        const feedId = priceFeeds[symbol];
        if (time) {
          const priceFeed = await priceService.getPriceFeed(feedId, time);
          const { price, expo } = priceFeed.getPriceUnchecked();
          return ethers.utils.parseUnits(price, 18 + expo);
        }
        const response = await priceService.getLatestPriceFeeds([feedId]);
        if (response) {
          const [priceFeed] = response;
          const { price, expo } = priceFeed.getPriceUnchecked();
          return ethers.utils.parseUnits(price, 18 + expo);
        }
      }
      return ethers.BigNumber.from(0);
    },
  });
};
