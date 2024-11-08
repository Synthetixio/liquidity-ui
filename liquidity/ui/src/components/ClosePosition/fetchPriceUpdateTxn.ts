import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { ethers } from 'ethers';
import { offchainMainnetEndpoint } from '@snx-v3/constants';

export async function fetchPriceUpdateTxn({
  PythVerfier,
  pythFeeds,
}: {
  PythVerfier: { address: string; abi: string[] };
  pythFeeds: string[];
}) {
  const PythVerifierInterface = new ethers.utils.Interface(PythVerfier.abi);
  const priceService = new EvmPriceServiceConnection(offchainMainnetEndpoint);
  const signedOffchainData = await priceService.getPriceFeedsUpdateData(pythFeeds);
  const priceUpdateTxn = {
    target: PythVerfier.address,
    callData: PythVerifierInterface.encodeFunctionData('updatePriceFeeds', [signedOffchainData]),
    value: ethers.BigNumber.from(pythFeeds.length),
    requireSuccess: false,
  };
  return priceUpdateTxn;
}
