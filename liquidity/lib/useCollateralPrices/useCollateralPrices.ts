import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { stringToHash, contractsHash } from '@snx-v3/tsHelpers';
import {
  Network,
  useDefaultProvider,
  useNetwork,
  useProviderForChain,
} from '@snx-v3/useBlockchain';
import { getPriceUpdates, getPythFeedIds } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useGetUSDTokens } from '@snx-v3/useGetUSDTokens';
import { erc7412Call } from '@snx-v3/withERC7412';
import { ZodBigNumber } from '@snx-v3/zod';
import Wei, { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

const PriceSchema = ZodBigNumber.transform((x) => wei(x));

export async function loadPrices({
  CoreProxyContract,
  collateralAddresses,
}: {
  CoreProxyContract: ethers.Contract;
  collateralAddresses: string[];
}) {
  const calls = await Promise.all(
    collateralAddresses.map((address) => {
      return CoreProxyContract.populateTransaction.getCollateralPrice(address);
    })
  );
  if (calls.length === 0) return { calls: [], decoder: () => [] };

  const decoder = (multicallEncoded: string | string[]) => {
    if (Array.isArray(multicallEncoded)) {
      return multicallEncoded.map((encoded) => {
        const pricesEncoded = CoreProxyContract.interface.decodeFunctionResult(
          'getCollateralPrice',
          encoded
        )[0];

        return PriceSchema.parse(pricesEncoded);
      });
    } else {
      const pricesEncoded = CoreProxyContract.interface.decodeFunctionResult(
        'getCollateralPrice',
        multicallEncoded
      )[0];
      return PriceSchema.parse(pricesEncoded);
    }
  };
  return { calls, decoder };
}

export const useCollateralPrices = (customNetwork?: Network) => {
  const { network } = useNetwork();
  const { data: CoreProxy } = useCoreProxy(customNetwork);
  const { data: collateralData } = useCollateralTypes(false, customNetwork);
  const { data: usdTokens } = useGetUSDTokens(customNetwork);

  const targetNetwork = customNetwork || network;
  const isBase = isBaseAndromeda(targetNetwork?.id, targetNetwork?.preset);

  const collateralAddresses =
    isBase && usdTokens?.sUSD
      ? collateralData?.map((x) => x.tokenAddress).concat(usdTokens.sUSD)
      : collateralData?.map((x) => x.tokenAddress);

  const connectedProvider = useDefaultProvider();
  const offlineProvider = useProviderForChain(customNetwork);

  const provider = customNetwork ? offlineProvider : connectedProvider;

  return useQuery({
    enabled: Boolean(CoreProxy && collateralAddresses && collateralAddresses?.length > 0),
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'CollateralPrices',
      {
        collaterals: stringToHash(collateralAddresses?.sort().join()),
        contractsHash: contractsHash([CoreProxy]),
      },
    ],
    queryFn: async () => {
      if (
        !CoreProxy ||
        !collateralAddresses ||
        collateralAddresses.length == 0 ||
        !targetNetwork ||
        !provider
      ) {
        throw 'useCollateralPrices missing required data';
      }

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
      const { calls, decoder } = await loadPrices({
        CoreProxyContract,
        collateralAddresses,
      });

      const allCalls = [...calls];

      const priceUpdateTx = (await getPriceUpdates(
        (await getPythFeedIds(targetNetwork)) as string[],
        targetNetwork
      ).catch(() => undefined)) as any;
      if (priceUpdateTx) {
        allCalls.unshift(priceUpdateTx);
      }

      const prices = await erc7412Call(
        targetNetwork,
        provider,
        allCalls,
        decoder,
        'useCollateralPrices'
      );

      return collateralAddresses.reduce((acc: Record<string, Wei | undefined>, address, i) => {
        if (Array.isArray(prices)) {
          acc[address] = prices[i];
        } else {
          acc[address] = prices;
        }
        return acc;
      }, {});
    },
  });
};
