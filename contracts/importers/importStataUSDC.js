export async function importStataUSDC(chainId, preset) {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '8453-andromeda': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/meta.json'),
        import(
          '@synthetixio/v3-contracts/8453-andromeda/CollateralToken_stataBasUSDC.readable.json'
        ),
      ]);
      return { address: meta.contracts.CollateralToken_stataBasUSDC, abi };
    }
    case '84532-andromeda': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/meta.json'),
        import(
          '@synthetixio/v3-contracts/11155111-main/CollateralToken_stataBasUSDC.readable.json'
        ),
      ]);
      return { address: meta.contracts.CollateralToken_stataUSDC, abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for Extras`);
    }
  }
}
