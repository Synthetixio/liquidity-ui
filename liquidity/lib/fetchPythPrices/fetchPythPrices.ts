import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { offchainMainnetEndpoint, offchainTestnetEndpoint } from '@snx-v3/constants';
import { Wei } from '@synthetixio/wei';
import { BigNumber, ethers, PopulatedTransaction } from 'ethers';

/**
 * Fetches price updates from the price service based on the requested price updates.
 * @deprecated This should not be used anywhere
 *
 * @param {Array} requestedPriceUpdates - The array of requested price updates.
 * @param {boolean} isTestnet - Specifies whether the fetch is for testnet or mainnet.
 * @returns {Promise<Array>} - The promise that resolves to an array of encoded price updates.
 */
export const fetchPriceUpdates = async (
  requestedPriceUpdates: { priceFeedId: string; stalenessTolerance: Wei }[],
  isTestnet: boolean
) => {
  if (requestedPriceUpdates.length === 0) return [];
  const priceService = new EvmPriceServiceConnection(
    isTestnet ? offchainTestnetEndpoint : offchainMainnetEndpoint
  );
  const signedPricesData = await priceService.getPriceFeedsUpdateData(
    requestedPriceUpdates.map(({ priceFeedId }) => priceFeedId)
  );

  return signedPricesData.map((signedOffchainData, i) => {
    const updateType = 1; // todo can I fetch this?

    const { priceFeedId, stalenessTolerance } = requestedPriceUpdates[i];
    return ethers.utils.defaultAbiCoder.encode(
      ['uint8', 'uint64', 'bytes32[]', 'bytes[]'],
      [updateType, stalenessTolerance.toBN(), [priceFeedId], [signedOffchainData]]
    );
  });
};

/**
 * Generates an array of PopulatedTransaction objects based on the given inputs.
 * @deprecated This should not be used anywhere
 *
 * @param {string} from - The address from which the transactions will be initiated.
 * @param {Object[]} oracleAddresses - An array of objects with an "address" property representing the oracle addresses.
 * @param {string[]} signedOffchainData - An array of signed offchain data for each oracle address.
 * @throws {Error} If the length of oracleAddresses and signedOffchainData arrays is not the same.
 * @returns {Object[]} An array of PopulatedTransaction objects.
 */
export const priceUpdatesToPopulatedTx = (
  from: string,
  oracleAddresses: { address: string }[],
  signedOffchainData: string[]
) => {
  if (oracleAddresses.length !== signedOffchainData.length) {
    throw new Error('oracleAddresses and signedOffchainData must be the same length');
  }
  return signedOffchainData.map((signedOffchainDatum, i) => {
    const tx: PopulatedTransaction = {
      to: oracleAddresses[i].address,
      from: from,
      data: new ethers.utils.Interface([
        'function fulfillOracleQuery(bytes calldata signedOffchainData) payable external',
      ]).encodeFunctionData('fulfillOracleQuery', [signedOffchainDatum]),
      // We set the value to 1 wei to avoid FeeRequired error from pyth, it's quite nice that their fee seems to be the lowest denominator on every network.
      // If this ever changes, things wont break, but become slower.
      value: BigNumber.from(1),
    };
    return tx;
  });
};
