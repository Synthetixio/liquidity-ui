import { ZEROWEI } from '@snx-v3/constants';
import { useOfflinePrices } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { wei } from '@synthetixio/wei';
import { useMemo } from 'react';

export const useTokenPrice = (symbol?: string) => {
  const { data: collateralTypes } = useCollateralTypes(true);

  const pythCollateralPrices = collateralTypes?.filter((item) => item.symbol !== 'stataUSDC');

  const { data: collateralPrices } = useOfflinePrices(
    (pythCollateralPrices || []).map((item) => ({
      id: item.tokenAddress,
      oracleId: item.oracleNodeId,
      symbol: item.symbol,
    }))
  );

  return useMemo(() => {
    if (!collateralTypes || !collateralPrices) {
      return ZEROWEI;
    }
    const collateralPrice =
      symbol === 'stataUSDC'
        ? collateralPrices.find((price) => `${price.symbol}`.toUpperCase() === 'USDC')
        : collateralPrices.find(
            (price) => `${price.symbol}`.toUpperCase() === `${symbol}`.toUpperCase()
          );
    return collateralPrice && collateralPrice.price ? wei(collateralPrice.price) : ZEROWEI;
  }, [collateralPrices, collateralTypes, symbol]);
};
