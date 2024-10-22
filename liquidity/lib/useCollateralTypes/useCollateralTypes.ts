import { importCollateralTokens } from '@snx-v3/contracts';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { wei, Wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export type CollateralType = {
  address: string;
  symbol: string;
  displaySymbol: string;
  name: string;
  decimals: number;
  depositingEnabled: boolean;
  issuanceRatioD18: Wei;
  liquidationRatioD18: Wei;
  liquidationRewardD18: Wei;
  minDelegationD18: Wei;
  oracleNodeId: string;
  tokenAddress: string;
  oracle: {
    constPrice?: Wei;
    externalContract?: string;
    stalenessTolerance?: string;
    pythFeedId?: string;
  };
};

async function loadCollateralTypes(chainId: number, preset: string) {
  return (await importCollateralTokens(chainId, preset))
    .map((config) => ({
      address: config.address,
      symbol: config.symbol,
      displaySymbol: config.symbol,
      name: config.name,
      decimals: config.decimals,
      depositingEnabled: config.depositingEnabled,
      issuanceRatioD18: wei(config.issuanceRatioD18, 18, true),
      liquidationRatioD18: wei(config.liquidationRatioD18, 18, true),
      liquidationRewardD18: wei(config.liquidationRewardD18, 18, true),
      minDelegationD18: wei(config.minDelegationD18, 18, true),
      oracleNodeId: config.oracleNodeId,
      tokenAddress: config.tokenAddress,
      oracle: {
        constPrice: config.oracle.constPrice ? wei(config.oracle.constPrice, 18, true) : undefined,
        externalContract: config.oracle.externalContract,
        stalenessTolerance: config.oracle.stalenessTolerance,
        pythFeedId: config.oracle.pythFeedId,
      },
    }))
    .filter(({ depositingEnabled }) => depositingEnabled);
}

export function useCollateralTypes(includeDelegationOff = false, customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const { data: systemToken } = useSystemToken(customNetwork);

  return useQuery({
    enabled: Boolean(targetNetwork?.id && targetNetwork?.preset && systemToken),
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'CollateralTypes',
      { systemToken: systemToken?.symbol, includeDelegationOff },
    ],
    queryFn: async () => {
      if (!(targetNetwork?.id && targetNetwork?.preset && systemToken))
        throw Error('useCollateralTypes should not be enabled when contracts missing');

      const collateralTypes = (await loadCollateralTypes(targetNetwork.id, targetNetwork.preset))
        .map((collateralType) => {
          const isBase = isBaseAndromeda(targetNetwork?.id, targetNetwork?.preset);
          if (isBase && collateralType.symbol === 'sUSDC') {
            return {
              ...collateralType,
              symbol: 'USDC',
              displaySymbol: 'USDC',
              name: 'USD Coin',
            };
          }
          if (isBase && collateralType.symbol === 'sStataUSDC') {
            return {
              ...collateralType,
              symbol: 'stataUSDC',
              displaySymbol: 'Static aUSDC',
              name: 'Static aUSDC',
            };
          }
          return {
            ...collateralType,
            displaySymbol: collateralType.displaySymbol ?? collateralType.symbol,
          };
        })
        .filter((collateralType) => collateralType.tokenAddress !== systemToken.address);

      if (includeDelegationOff) {
        return collateralTypes;
      }

      // Return collateral types that have minDelegationD18 < MaxUint256
      // When minDelegationD18 === MaxUint256, delegation is effectively disabled
      return collateralTypes.filter((collateralType) =>
        collateralType.minDelegationD18.lt(ethers.constants.MaxUint256)
      );
    },
    // one hour in ms
    staleTime: Infinity,
    placeholderData: [],
  });
}

export function useCollateralType(collateralSymbol?: string) {
  const { data: collateralTypes, isFetching: isCollateralTypesFetching } = useCollateralTypes();

  function getCollateralType(collateralSymbol?: string) {
    if (!collateralTypes || !collateralTypes?.length) {
      return;
    }

    if (!collateralSymbol) {
      return collateralTypes[0];
    }

    return collateralTypes?.find(
      (collateral) => `${collateral.symbol}`.toLowerCase() === `${collateralSymbol}`.toLowerCase()
    );
  }

  return {
    isFetching: isCollateralTypesFetching,
    data: getCollateralType(collateralSymbol),
  };
}
