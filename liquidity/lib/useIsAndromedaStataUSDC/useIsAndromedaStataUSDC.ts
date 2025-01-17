import { Network } from '@snx-v3/useBlockchain';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import React from 'react';

export function useIsAndromedaStataUSDC({
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
    const isAndromedaStataUSDC = synthTokens.some(
      (synthToken) =>
        synthToken.symbol === 'sStataUSDC' && addr === synthToken.address.toLowerCase()
    );
    return isAndromedaStataUSDC;
  }, [tokenAddress, synthTokens]);
}
