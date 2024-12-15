export async function importSynthTokens(
  chainId?: number,
  preset?: string
): Promise<
  {
    synthMarketId: string;
    address: string;
    symbol: string;
    name: string;
    decimals: number;

    // undefined for some synths (like Synthetic USDe on Mainnet)
    token?: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
    };
  }[]
> {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      const [{ default: synthTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/1-main/synthTokens.json'),
      ]);
      return synthTokens;
    }
    case '11155111-main': {
      const [{ default: synthTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/synthTokens.json'),
      ]);
      return synthTokens;
    }
    case '10-main': {
      const [{ default: synthTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/synthTokens.json'),
      ]);
      return synthTokens;
    }
    case '8453-andromeda': {
      const [{ default: synthTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/synthTokens.json'),
      ]);
      return synthTokens;
    }
    case '84532-andromeda': {
      const [{ default: synthTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/synthTokens.json'),
      ]);
      return synthTokens;
    }
    case '42161-main': {
      const [{ default: synthTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/42161-main/synthTokens.json'),
      ]);
      return synthTokens;
    }
    case '421614-main': {
      const [{ default: synthTokens }] = await Promise.all([
        import('@synthetixio/v3-contracts/421614-main/synthTokens.json'),
      ]);
      return synthTokens;
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for SynthTokens`);
    }
  }
}
