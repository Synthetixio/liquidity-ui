import { calculateCRatio } from '@snx-v3/calculations';
import { keyBy, stringToHash, contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { loadPrices } from '@snx-v3/useCollateralPrices';
import { getPriceUpdates, getPythFeedIds } from '@snx-v3/useCollateralPriceUpdates';
import { CollateralType, useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { loadPosition } from '@snx-v3/useLiquidityPosition';
import { usePools } from '@snx-v3/usePools';
import { erc7412Call } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export type LiquidityPositionType = {
  id: `${string}-${string}`;
  accountId: string;
  poolId: string;
  isPreferred: boolean;
  poolName: string;
  collateralAmount: Wei;
  collateralPrice: Wei;
  collateralValue: Wei;
  collateralType: CollateralType;
  availableCollateral: Wei;
  cRatio: Wei;
  debt: Wei;
};

function toPairs<T>(array: T[]): [T, T][] {
  return Array.from(
    { length: array.length / 2 },
    (_, i) => [array[i * 2], array[i * 2 + 1]] as [T, T]
  );
}

export const useLiquidityPositions = ({ accountId }: { accountId?: string }) => {
  const { data: CoreProxy } = useCoreProxy();
  const { data: pools } = usePools();
  const { data: collateralTypes } = useCollateralTypes();

  const { network } = useNetwork();
  const provider = useProviderForChain(network!);

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'LiquidityPositions',
      { accountId },
      {
        pools: stringToHash((pools ? pools.map((pool) => pool.id).sort() : []).join()),
        contractsHash: contractsHash([CoreProxy, ...(collateralTypes || [])]),
      },
    ],
    staleTime: 60_000 * 5,
    enabled: Boolean(network && provider && CoreProxy && accountId && collateralTypes && pools),
    queryFn: async () => {
      if (!(network && provider && CoreProxy && accountId && collateralTypes && pools))
        throw 'OMFG';

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const positionCallsAndDataNested = await Promise.all(
        pools.map(async ({ id: poolId, name: poolName, isPreferred }) =>
          Promise.all(
            collateralTypes.map(async (collateralType) => {
              const { calls, decoder } = await loadPosition({
                CoreProxyContract,
                accountId,
                poolId,
                tokenAddress: collateralType.tokenAddress,
              });
              return { calls, decoder, poolName, collateralType, poolId, isPreferred };
            })
          )
        )
      );

      const positionCallsAndData = positionCallsAndDataNested.flat();

      const { calls: priceCalls, decoder: priceDecoder } = await loadPrices({
        collateralAddresses: collateralTypes.map((x) => x.tokenAddress),
        CoreProxyContract,
      });

      const positionCalls = positionCallsAndData.map((x) => x.calls).flat();

      const availableCollateralCalls = await Promise.all(
        collateralTypes.map(
          (collateralType) =>
            CoreProxyContract.populateTransaction.getAccountAvailableCollateral(
              accountId,
              collateralType.tokenAddress
            ),
          []
        )
      );

      const allCalls = priceCalls.concat(positionCalls).concat(availableCollateralCalls);
      const singlePositionDecoder = positionCallsAndData.at(0)?.decoder;

      const priceUpdateTx = (await getPriceUpdates(
        (await getPythFeedIds(network)) as string[],
        network
      ).catch(() => undefined)) as any;
      if (priceUpdateTx) {
        allCalls.unshift(priceUpdateTx);
      }

      return await erc7412Call(
        network,
        provider!,
        allCalls,
        (encoded) => {
          if (!Array.isArray(encoded)) throw Error('Expected array');
          if (!singlePositionDecoder) return {};

          const prices = priceDecoder(encoded.slice(0, priceCalls.length));
          const pricesByAddress = keyBy(
            'address',
            Array.isArray(prices)
              ? prices.map((price, i) => ({
                  price,
                  address: collateralTypes[i].tokenAddress,
                }))
              : [{ price: prices, address: collateralTypes[0].tokenAddress }]
          );

          const pairedPositionsEncoded = toPairs(
            encoded.slice(priceCalls.length, priceCalls.length + positionCalls.length)
          );
          const positionData = pairedPositionsEncoded.map((x) => singlePositionDecoder(x));

          const availableCollaterals = encoded
            .slice(priceCalls.length + positionCalls.length)
            .map((encode) =>
              CoreProxyContract.interface.decodeFunctionResult(
                'getAccountAvailableCollateral',
                encode
              )
            );
          const availableCollateralByAddress = keyBy(
            'address',
            Array.isArray(availableCollaterals)
              ? availableCollaterals.map((availableCollateral, i) => ({
                  availableCollateral: wei(availableCollateral[0]),
                  address: collateralTypes[i].tokenAddress,
                }))
              : [
                  {
                    availableCollateral: wei(availableCollaterals[0]),
                    address: collateralTypes[0].tokenAddress,
                  },
                ]
          );

          const positions = positionData.map(({ debt, collateral }, index) => {
            const { poolName, collateralType, poolId, isPreferred } = positionCallsAndData[index];
            // Value will be removed from the collateral call in next release, so to prepare for that calculate it manually
            const collateralAmount = collateral.amount;
            const collateralPrice = pricesByAddress?.[collateralType.tokenAddress].price;
            const collateralValue = collateralPrice
              ? collateralAmount.mul(collateralPrice)
              : wei(0);
            const availableCollateral =
              availableCollateralByAddress?.[collateralType.tokenAddress].availableCollateral;
            const cRatio = calculateCRatio(debt, collateralValue);

            return {
              id: `${poolId}-${collateralType.symbol}` as const,
              accountId,
              poolId,
              poolName,
              collateralPrice,
              collateralAmount,
              collateralValue,
              collateralType,
              cRatio,
              debt,
              isPreferred,
              availableCollateral,
            };
          });
          return keyBy('id', positions);
        },
        'useLiquidityPositions'
      );
    },
  });
};
