import { POOL_ID } from '@snx-v3/constants';
import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { erc7412Call } from '@snx-v3/withERC7412';
import { SmallIntSchema, WeiSchema } from '@snx-v3/zod';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { z } from 'zod';

export const MarketConfigurationSchema = z.object({
  id: SmallIntSchema,
  weight: WeiSchema,
  maxDebtShareValue: WeiSchema,
  isLocked: z.boolean(),
});

export const PoolConfigurationSchema = z.object({
  id: z.number(),
  markets: MarketConfigurationSchema.array(),
  isAnyMarketLocked: z.boolean(),
});

export const usePoolConfiguration = () => {
  const { network } = useNetwork();
  const { data: CoreProxy } = useCoreProxy();
  const provider = useProvider();

  return useQuery({
    enabled: Boolean(CoreProxy && network && provider),
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'PoolConfiguration',
      { contractsHash: contractsHash([CoreProxy]) },
    ],
    queryFn: async () => {
      if (!(CoreProxy && network && provider)) throw 'OMFG';
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const marketsData: {
        marketId: ethers.BigNumber;
        maxDebtShareValueD18: ethers.BigNumber;
        weightD18: ethers.BigNumber;
      }[] = await CoreProxyContract.getPoolConfiguration(ethers.BigNumber.from(POOL_ID));
      const markets = marketsData.map(({ marketId, maxDebtShareValueD18, weightD18 }) => ({
        id: marketId,
        weight: maxDebtShareValueD18,
        maxDebtShareValue: weightD18,
      }));

      const allCalls = await Promise.all(
        markets.map((m) => CoreProxyContract.populateTransaction.isMarketCapacityLocked(m.id))
      );

      const decoded = await erc7412Call(
        network,
        provider,
        allCalls,
        (decodedMulticall) => {
          return decodedMulticall.map(({ returnData }) => {
            const [isMarketCapacityLocked] = CoreProxyContract.interface.decodeFunctionResult(
              'isMarketCapacityLocked',
              returnData
            );
            return isMarketCapacityLocked;
          });
        },
        'isMarketCapacityLocked'
      );

      return PoolConfigurationSchema.parse({
        id: parseInt(POOL_ID),
        markets: markets.map((market, i) => ({
          ...market,
          isLocked: decoded[i],
        })),
        isAnyMarketLocked: decoded.some(Boolean),
      });
    },
  });
};
