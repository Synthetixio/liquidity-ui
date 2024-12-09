import { importCollateralTokens } from '@snx-v3/contracts';
import { contractsHash } from '@snx-v3/tsHelpers';
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
  const { network: currentNetwork } = useNetwork();
  const network = customNetwork ?? currentNetwork;
  const { data: systemToken } = useSystemToken(customNetwork);

  return useQuery({
    enabled: Boolean(network?.id && network?.preset && systemToken),
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'CollateralTypes',
      { systemToken: systemToken?.symbol, includeDelegationOff },
    ],
    queryFn: async () => {
      if (!(network?.id && network?.preset && systemToken))
        throw Error('useCollateralTypes should not be enabled when contracts missing');

      const collateralTypes = (await loadCollateralTypes(network.id, network.preset))
        .map((collateralType) => {
          if (network?.preset === 'andromeda' && collateralType.symbol === 'sUSDC') {
            return {
              ...collateralType,
              symbol: 'USDC',
              displaySymbol: 'USDC',
              name: 'USD Coin',
            };
          }
          if (network?.preset === 'andromeda' && collateralType.symbol === 'sStataUSDC') {
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
    staleTime: 3_600_000,
    placeholderData: [],
  });
}

export function useCollateralType(collateralSymbol?: string, customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;

  const { data: collateralTypes } = useCollateralTypes(true, customNetwork);

  return useQuery({
    enabled: Boolean(
      targetNetwork?.id && targetNetwork?.preset && collateralTypes && collateralTypes.length > 0
    ),
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'CollateralType',
      { collaterals: contractsHash(collateralTypes ?? []) },
      { collateralSymbol },
    ],
    queryFn: async () => {
      if (!(targetNetwork?.id && targetNetwork?.preset && collateralTypes && collateralSymbol)) {
        throw new Error('OMFG');
      }
      const collateralType = collateralTypes.find(
        (collateral) => `${collateral.symbol}`.toLowerCase() === `${collateralSymbol}`.toLowerCase()
      );
      if (!collateralType) {
        throw new Error('Unsupported collateral');
      }
      return collateralType;
    },
    // one hour in ms
    staleTime: 3_600_000,
    throwOnError: false,
  });
}
