export async function importCollateralTokens(
  chainId?: number,
  preset?: string
): Promise<
  {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    depositingEnabled: boolean;
    issuanceRatioD18: string;
    liquidationRatioD18: string;
    liquidationRewardD18: string;
    oracleNodeId: string;
    tokenAddress: string;
    minDelegationD18: string;
    oracle: {
      constPrice?: string;
      externalContract?: string;
      stalenessTolerance?: string;
      pythFeedId?: string;
    };
  }[]
> {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      const [{ default: collateralTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/1-main/collateralTokens.json'),
      ]);
      return collateralTokens;
    }
    case '11155111-main': {
      const [{ default: collateralTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/collateralTokens.json'),
      ]);
      return collateralTokens;
    }
    case '10-main': {
      const [{ default: collateralTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/collateralTokens.json'),
      ]);
      return collateralTokens;
    }
    case '8453-andromeda': {
      const [{ default: collateralTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/collateralTokens.json'),
      ]);
      return collateralTokens;
    }
    case '84532-andromeda': {
      const [{ default: collateralTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/collateralTokens.json'),
      ]);
      return collateralTokens;
    }
    case '42161-main': {
      const [{ default: collateralTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/42161-main/collateralTokens.json'),
      ]);
      return collateralTokens;
    }
    case '421614-main': {
      const [{ default: collateralTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/421614-main/collateralTokens.json'),
      ]);
      return collateralTokens;
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for CollateralTokens`);
    }
  }
}
