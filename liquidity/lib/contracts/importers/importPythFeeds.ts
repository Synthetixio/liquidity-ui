function filterDeprecated(feedId: string) {
  return ![
    //
    '0x5c6c0d2386e3352356c3ab84434fafb5ea067ac2678a38a338c4a69ddc4bdb0c', // FTM
    '0x06ade621dbc31ed0fc9255caaab984a468abe84164fb2ccc76f02a4636d97e31', // EOS
  ].includes(feedId);
}

export async function importPythFeeds(chainId?: number, preset?: string): Promise<string[]> {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/1-main/pythFeeds.json'),
      ]);
      return pythFeeds.filter(filterDeprecated);
    }
    case '11155111-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/pythFeeds.json'),
      ]);
      return pythFeeds.filter(filterDeprecated);
    }
    case '10-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/pythFeeds.json'),
      ]);
      return pythFeeds.filter(filterDeprecated);
    }
    case '8453-andromeda': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/pythFeeds.json'),
      ]);
      return pythFeeds.filter(filterDeprecated);
    }
    case '84532-andromeda': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/pythFeeds.json'),
      ]);
      return pythFeeds.filter(filterDeprecated);
    }
    case '42161-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/42161-main/pythFeeds.json'),
      ]);
      return pythFeeds.filter(filterDeprecated);
    }
    case '421614-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/421614-main/pythFeeds.json'),
      ]);
      return pythFeeds.filter(filterDeprecated);
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for pythFeeds`);
    }
  }
}
