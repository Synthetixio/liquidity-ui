import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { offchainMainnetEndpoint } from '@snx-v3/constants';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

const priceService = new EvmPriceServiceConnection(offchainMainnetEndpoint);

export const usePythPrice = (symbol?: string) => {
  return useQuery({
    queryKey: ['PythPrice', symbol],
    enabled: Boolean(symbol),
    queryFn: async () => {
      if (symbol === 'SNX') {
        const response = await priceService.getLatestPriceFeeds([
          '0x39d020f60982ed892abbcd4a06a276a9f9b7bfbce003204c110b6e488f502da3',
        ]);
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
