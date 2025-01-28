const abi = [
  // ERC20
  'error InsufficientAllowance(uint256 required, uint256 existing)',
  'error InsufficientBalance(uint256 required, uint256 existing)',
  'event Approval(address indexed owner, address indexed spender, uint256 amount)',
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',
  'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',

  // SNX
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
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/1-main/meta.json'),
      ]);
      return { address: meta.contracts.CollateralToken_SNX, abi };
    }
    case '11155111-main': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/meta.json'),
      ]);
      return { address: meta.contracts.CollateralToken_SNX, abi };
    }
    case '10-main': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/10-main/meta.json'),
      ]);
      return { address: meta.contracts.CollateralToken_SNX, abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for SNX`);
    }
  }
}
