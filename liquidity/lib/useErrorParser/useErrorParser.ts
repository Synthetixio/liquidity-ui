import { Network, useNetwork } from '@snx-v3/useBlockchain';
import React from 'react';
import { parseError } from './parseError';

export function useErrorParser(customNetwork?: Network) {
  const { network: walletNetwork } = useNetwork();
  const network = customNetwork ? customNetwork : walletNetwork;
  return React.useCallback(
    async (error: Error) => {
      if (network?.id && network?.preset) {
        return await parseError({ error, chainId: network?.id, preset: network?.preset });
      }
      throw error;
    },
    [network?.id, network?.preset]
  );
}
