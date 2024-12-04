import { Network } from '@snx-v3/useBlockchain';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import React from 'react';

export function useIsSynthStataUSDC({
  tokenAddress,
  customNetwork,
}: {
  tokenAddress?: string;
  customNetwork?: Network;
}) {
  const { data: synthTokens } = useSynthTokens(customNetwork);
  return React.useMemo(() => {
    if (!synthTokens) {
      return false;
    }
    if (!tokenAddress) {
      return false;
    }
    const addr = tokenAddress?.toLowerCase();
    const isSynthStata = synthTokens.some(
      (token) => token.symbol === 'sStataUSDC' && addr === token.address.toLowerCase()
    );
    return isSynthStata;
  }, [tokenAddress, synthTokens]);
}
