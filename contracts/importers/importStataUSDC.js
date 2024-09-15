export async function importStataUSDC(chainId, preset) {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '8453-andromeda': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/meta.json'),
        import('./stataUSDC.json'),
        //import('@synthetixio/v3-contracts/8453-andromeda/LegacyMarketProxy.readable.json'),
      ]);
      return { address: meta.contracts.CollateralToken_stataBasUSDC, abi };
    }
    case '84532-andromeda': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/meta.json'),
        import('./stataUSDC.json'),
        //import('@synthetixio/v3-contracts/11155111-main/LegacyMarketProxy.readable.json'),
      ]);
      return { address: meta.contracts.CollateralToken_stataUSDC, abi };
    }
    /*case '10-main': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/meta.json'),
        import('@synthetixio/v3-contracts/10-main/LegacyMarketProxy.readable.json'),
      ]);
      return { address: meta.contracts.LegacyMarketProxy, abi };
		}*/
    default: {
      throw new Error(`Unsupported deployment ${deployment} for Extras`);
    }
  }
}
