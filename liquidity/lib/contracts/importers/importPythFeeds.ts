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
      return pythFeeds;
    }
    case '11155111-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/pythFeeds.json'),
      ]);
      return pythFeeds;
    }
    case '10-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/pythFeeds.json'),
      ]);
      return pythFeeds;
    }
    case '8453-andromeda': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/pythFeeds.json'),
      ]);
      return pythFeeds;
    }
    case '84532-andromeda': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/pythFeeds.json'),
      ]);
      return pythFeeds;
    }
    case '42161-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/42161-main/pythFeeds.json'),
      ]);
      return pythFeeds;
    }
    case '421614-main': {
      const [{ default: pythFeeds }] = await Promise.all([
        import('@synthetixio/v3-contracts/421614-main/pythFeeds.json'),
      ]);
      return pythFeeds;
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for pythFeeds`);
    }
  }
}
