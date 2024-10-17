declare module '@snx-v3/contracts' {
  function importCoreProxy(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importAccountProxy(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importUSDProxy(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importV2x(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importSpotMarketProxy(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importMulticall3(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importLegacyMarket(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importOracleManagerProxy(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importPythERC7412Wrapper(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importRewardsDistributors(
    chainId?: number,
    preset?: string
  ): Promise<
    {
      address: string;
      name: string;
      poolId: string;

      // undefined for Pool-level distributors
      collateralType?: {
        address: string;
        symbol: string;
        name: string;
        decimals: number;
      };

      payoutToken: {
        address: string;
        symbol: string;
        name: string;
        decimals: number;
      };
      rewardManager: string;
      isRegistered: boolean;
    }[]
  >;

  function importExtras(
    chainId?: number,
    preset?: string
  ): Promise<{
    [key: string]: string;
  }>;

  function importCollateralTokens(
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
  >;

  function importSystemToken(
    chainId?: number,
    preset?: string
  ): Promise<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  }>;

  function importSynthTokens(
    chainId?: number,
    preset?: string
  ): Promise<
    {
      synthMarketId: string;
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      token: {
        address: string;
        symbol: string;
        name: string;
        decimals: number;
      };
    }[]
  >;

  function importAllErrors(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importStaticAaveUSDC(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importWETH(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importSNX(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importUSDC(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;

  function importPythFeeds(chainId?: number, preset?: string): Promise<string[]>;

  function importPythVerfier(
    chainId?: number,
    preset?: string
  ): Promise<{ address: string; abi: string[] }>;
}
