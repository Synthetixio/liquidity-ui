const abi = [
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
];

export async function importUSDC(chainId, preset) {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      return { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', abi };
    }
    case '11155111-main': {
      return { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', abi };
    }
    case '10-main': {
      return { address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', abi };
    }
    case '8453-andromeda': {
      return { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', abi };
    }
    case '84532-andromeda': {
      return { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', abi };
    }
    case '42161-main': {
      return { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', abi };
    }
    case '421614-main': {
      return { address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for USDC`);
    }
  }
}
