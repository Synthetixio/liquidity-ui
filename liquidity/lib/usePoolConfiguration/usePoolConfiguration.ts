import { useProvider, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { erc7412Call } from '@snx-v3/withERC7412';
import { SmallIntSchema, WeiSchema } from '@snx-v3/zod';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { z } from 'zod';
import { contractsHash, stringToHash } from '@snx-v3/tsHelpers';

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

const isLockedSchema = z.boolean();

export const usePoolConfiguration = (poolId?: string) => {
  const { network } = useNetwork();
  const { data: CoreProxy } = useCoreProxy();
  const provider = useProvider();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  return useQuery({
    enabled: Boolean(CoreProxy && poolId && network && provider),
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'PoolConfiguration',
      { poolId },
      {
        contractsHash: contractsHash([CoreProxy]),
        priceUpdateTx: stringToHash(priceUpdateTx?.data),
      },
    ],
    queryFn: async () => {
      if (!(CoreProxy && poolId && network && provider)) throw 'OMFG';
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const marketsData: {
        marketId: ethers.BigNumber;
        maxDebtShareValueD18: ethers.BigNumber;
        weightD18: ethers.BigNumber;
      }[] = await CoreProxyContract.getPoolConfiguration(ethers.BigNumber.from(poolId));
      const markets = marketsData.map(({ marketId, maxDebtShareValueD18, weightD18 }) => ({
        id: marketId,
        weight: maxDebtShareValueD18,
        maxDebtShareValue: weightD18,
      }));

      const calls = await Promise.all(
        markets.map((m) => CoreProxyContract.populateTransaction.isMarketCapacityLocked(m.id))
      );

      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const decoded = await erc7412Call(
        network,
        provider,
        calls,
        (encoded) => {
          const result = Array.isArray(encoded) ? encoded : [encoded];
          return result.map((x) =>
            isLockedSchema.parse(
              CoreProxyContract.interface.decodeFunctionResult('isMarketCapacityLocked', x)[0]
            )
          );
        },
        'isMarketCapacityLocked'
      );

      return PoolConfigurationSchema.parse({
        id: parseInt(poolId),
        markets: markets.map((market, i) => ({
          ...market,
          isLocked: decoded[i],
        })),
        isAnyMarketLocked: decoded.some(Boolean),
      });
    },
  });
};
