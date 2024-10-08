import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { offchainMainnetEndpoint } from '@snx-v3/constants';
import { importMulticall3, importPythERC7412Wrapper, importPythFeeds } from '@snx-v3/contracts';
import { parseUnits } from '@snx-v3/format';
import { Network, useDefaultProvider, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { CollateralType } from '@snx-v3/useCollateralTypes';
import { ERC7412_ABI } from '@snx-v3/withERC7412';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

const priceService = new EvmPriceServiceConnection(offchainMainnetEndpoint);

const getPriceUpdates = async (
  priceIds: string[],
  stalenessTolerance: number,
  network: Network
) => {
  const signedOffchainData = await priceService.getPriceFeedsUpdateData(priceIds);
  const updateType = 1;
  const data = ethers.utils.defaultAbiCoder.encode(
    ['uint8', 'uint64', 'bytes32[]', 'bytes[]'],
    [updateType, stalenessTolerance, priceIds, signedOffchainData]
  );
  const erc7412Interface = new ethers.utils.Interface(ERC7412_ABI);

  const PythERC7412Wrapper = await importPythERC7412Wrapper(network.id, network.preset);

  return {
    to: PythERC7412Wrapper.address,
    data: erc7412Interface.encodeFunctionData('fulfillOracleQuery', [data]),
    value: priceIds.length,
  };
};

/**
 * @deprecated
 */
export const useOfflinePrices = (collaterals?: CollateralType[]) => {
  return useQuery({
    queryKey: ['offline-prices', collaterals?.map((collateral) => collateral.address).join('-')],
    enabled: Boolean(collaterals && collaterals.length > 0),
    queryFn: async () => {
      if (!collaterals) {
        throw 'useOfflinePrices is missing required data';
      }

      const stables = ['sUSDC', 'USDC'];
      const filteredCollaterals = collaterals.filter((item) => !stables.includes(item.symbol));

      const returnData: { symbol: string; price: ethers.BigNumberish }[] = [
        {
          symbol: 'sUSDC',
          price: wei(1).toBN(),
        },
        {
          symbol: 'USDC',
          price: wei(1).toBN(),
        },
        {
          symbol: 'USDx',
          price: wei(1).toBN(),
        },
      ];

      if (!filteredCollaterals.length) {
        return returnData;
      }

      const collateralsWithPriceId = filteredCollaterals;
      // const collateralsWithPriceId = await getPythFeedIdsFromCollateralList(filteredCollaterals);
      const prices = await priceService.getLatestPriceFeeds(
        collaterals
          .filter((collateralType) => collateralType?.oracle)
          // @ts-ignore
          .map((x) => x.priceId) as string[]
      );
      prices?.forEach((item) => {
        // @ts-ignore
        const col = collateralsWithPriceId.find(({ priceId }) => priceId === `0x${item.id}`);
        const price = item.getPriceUnchecked();
        if (col) {
          returnData.push({
            symbol: col.symbol,
            price: parseUnits(price.price, 18 + price.expo),
          });
        }
      });
      return returnData;
    },
    refetchInterval: 60000,
  });
};

export const useCollateralPriceUpdates = (customNetwork?: Network) => {
  const { network: currentNetwork } = useNetwork();
  const network = customNetwork || currentNetwork;
  const provider = useDefaultProvider();
  const { activeWallet } = useWallet();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'CollateralPriceUpdates',
      activeWallet?.address,
    ],
    enabled: Boolean(network?.id && network?.preset),
    queryFn: async () => {
      const stalenessTolerance = 3300; // normally we have tolerance of 3600, which leaves us with extra 5min
      if (!(network?.id && network?.preset)) {
        throw 'OMG';
      }

      try {
        const { address: multicallAddress, abi: multiCallAbi } = await importMulticall3(
          network.id,
          network.preset
        );

        const multicallInterface = new ethers.utils.Interface(multiCallAbi);
        const pythInterface = new ethers.utils.Interface([
          'function getLatestPrice(bytes32 priceId, uint256 stalenessTolerance) external view returns (int256)',
        ]);

        const pythFeedIds = await importPythFeeds(network.id, network.preset);
        if (window.localStorage.getItem('DEBUG') === 'true') {
          // eslint-disable-next-line no-console
          console.log('[useCollateralPriceUpdates]', { pythFeedIds });
        }

        if (pythFeedIds.length === 0) {
          return null;
        }

        const { address } = await importPythERC7412Wrapper(network.id, network.preset);

        const txs = [
          ...pythFeedIds.map((priceId) => ({
            target: address,
            callData: pythInterface.encodeFunctionData('getLatestPrice', [
              priceId,
              stalenessTolerance,
            ]),
            value: 0,
            requireSuccess: false,
          })),
        ];

        const getPricesTx = multicallInterface.encodeFunctionData('aggregate3Value', [txs]);

        const result = await provider?.call({
          data: getPricesTx,
          to: multicallAddress,
        });

        const decodedMultiCall: { success: boolean }[] = multicallInterface.decodeFunctionResult(
          'aggregate3Value',
          result || ''
        )[0];

        const outdatedPriceIds: string[] = [];

        decodedMultiCall.forEach(({ success }, i) => {
          if (!success) {
            outdatedPriceIds.push(pythFeedIds[i]);
          }
        });
        if (window.localStorage.getItem('DEBUG') === 'true') {
          // eslint-disable-next-line no-console
          console.log('[useCollateralPriceUpdates]', { outdatedPriceIds });
        }

        if (outdatedPriceIds.length) {
          return {
            ...(await getPriceUpdates(outdatedPriceIds, stalenessTolerance, network)),
            from: activeWallet?.address,
          };
        }

        return null;
      } catch (error) {
        return null;
      }
    },
    refetchInterval: 120_000,
  });
};
