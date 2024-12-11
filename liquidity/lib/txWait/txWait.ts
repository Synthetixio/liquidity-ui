import { Network } from '@snx-v3/useBlockchain';
import { ethers } from 'ethers';

export const txWait = (tx: ethers.providers.TransactionResponse, network: Network) => {
  const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl());

  return provider.waitForTransaction(tx.hash);
};
