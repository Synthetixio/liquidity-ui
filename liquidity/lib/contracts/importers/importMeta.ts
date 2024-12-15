export async function importMeta(
  chainId?: number,
  preset?: string
): Promise<{
  chainId: number;
  name: string;
  preset: string;
  version: string;
  generator: string;
  timestamp: number;
  miscUrl: string;
  contracts: {
    [key: string]: string;
  };
}> {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/1-main/meta.json'),
      ]);
      return meta;
    }
    case '11155111-main': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/meta.json'),
      ]);
      return meta;
    }
    case '10-main': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/meta.json'),
      ]);
      return meta;
    }
    case '8453-andromeda': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/meta.json'),
      ]);
      return meta;
    }
    case '84532-andromeda': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/meta.json'),
      ]);
      return meta;
    }
    case '42161-main': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/42161-main/meta.json'),
      ]);
      return meta;
    }
    case '421614-main': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/421614-main/meta.json'),
      ]);
      return meta;
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for meta`);
    }
  }
}
