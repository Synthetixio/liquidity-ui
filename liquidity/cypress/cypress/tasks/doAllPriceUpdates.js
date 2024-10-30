#!/usr/bin/env node

import { importExtras, importPythFeeds } from '@snx-v3/contracts';
import { doPriceUpdateForPyth } from './doPriceUpdateForPyth';

const splitIntoChunks = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export async function doAllPriceUpdates({ address }) {
  const extras = await importExtras(process.env.CYPRESS_CHAIN_ID, process.env.CYPRESS_PRESET);
  const feedIds = await importPythFeeds(process.env.CYPRESS_CHAIN_ID, process.env.CYPRESS_PRESET);
  const priceVerificationContract =
    extras.pyth_price_verification_address || extras.pythPriceVerificationAddress;
  console.log({ feedIds });
  const batches = splitIntoChunks(feedIds, 200);

  for (const batch of batches) {
    console.log({ batch });
    await doPriceUpdateForPyth({ address, feedId: batch, priceVerificationContract });
  }
  return true;
}
