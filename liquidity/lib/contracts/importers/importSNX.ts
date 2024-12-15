const extraAbi = [
  'function transferableSynthetix(address account) view returns (uint256 transferable)',
  'function collateral(address account) view returns (uint256 collateral)',
];

export async function importSNX(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/1-main/meta.json'),
        import('@synthetixio/v3-contracts/1-main/CollateralToken_SNX.readable.json'),
      ]);
      return { address: meta.contracts.CollateralToken_SNX, abi: [...abi, ...extraAbi] };
    }
    case '11155111-main': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/meta.json'),
        import('@synthetixio/v3-contracts/11155111-main/CollateralToken_SNX.readable.json'),
      ]);
      return { address: meta.contracts.CollateralToken_SNX, abi: [...abi, ...extraAbi] };
    }
    case '10-main': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/meta.json'),
        import('@synthetixio/v3-contracts/10-main/CollateralToken_SNX.readable.json'),
      ]);
      return { address: meta.contracts.CollateralToken_SNX, abi: [...abi, ...extraAbi] };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for SNX`);
    }
  }
}
