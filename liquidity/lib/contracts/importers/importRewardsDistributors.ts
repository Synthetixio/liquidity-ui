export async function importRewardsDistributors(
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
> {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      const [{ default: rewardsDistributors }] = await Promise.all([
        import('@synthetixio/v3-contracts/1-main/rewardsDistributors.json'),
      ]);
      return rewardsDistributors;
    }
    case '11155111-main': {
      const [{ default: rewardsDistributors }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/rewardsDistributors.json'),
      ]);
      return rewardsDistributors;
    }
    case '10-main': {
      const [{ default: rewardsDistributors }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/rewardsDistributors.json'),
      ]);
      return rewardsDistributors;
    }
    case '8453-andromeda': {
      const [{ default: rewardsDistributors }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/rewardsDistributors.json'),
      ]);
      return rewardsDistributors;
    }
    case '84532-andromeda': {
      const [{ default: rewardsDistributors }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/rewardsDistributors.json'),
      ]);
      return rewardsDistributors;
    }
    case '42161-main': {
      const [{ default: rewardsDistributors }] = await Promise.all([
        import('@synthetixio/v3-contracts/42161-main/rewardsDistributors.json'),
      ]);
      return rewardsDistributors;
    }
    case '421614-main': {
      const [{ default: rewardsDistributors }] = await Promise.all([
        import('@synthetixio/v3-contracts/421614-main/rewardsDistributors.json'),
      ]);
      return rewardsDistributors;
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for RewardsDistributors`);
    }
  }
}
