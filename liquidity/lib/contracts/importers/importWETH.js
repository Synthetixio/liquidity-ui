const abi = [
  'function name() view returns (string)',
  'function approve(address guy, uint256 wad) returns (bool)',
  'function totalSupply() view returns (uint256)',
  'function transferFrom(address src, address dst, uint256 wad) returns (bool)',
  'function withdraw(uint256 wad)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
  'function transfer(address dst, uint256 wad) returns (bool)',
  'function deposit() payable',
  'function allowance(address, address) view returns (uint256)',
  'event Approval(address indexed src, address indexed guy, uint256 wad)',
  'event Transfer(address indexed src, address indexed dst, uint256 wad)',
  'event Deposit(address indexed dst, uint256 wad)',
  'event Withdrawal(address indexed src, uint256 wad)',
];

export async function importWETH(chainId, preset) {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      return { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', abi };
    }
    case '11155111-main': {
      return { address: '0xf531B8F309Be94191af87605CfBf600D71C2cFe0', abi };
    }
    case '10-main': {
      return { address: '0x4200000000000000000000000000000000000006', abi };
    }
    case '8453-andromeda': {
      return { address: '0x4200000000000000000000000000000000000006', abi };
    }
    case '84532-andromeda': {
      return { address: '0x6E9fd273209C1DfA62a085ae017ff1bc778E4114', abi };
    }
    case '42161-main': {
      return { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', abi };
    }
    case '421614-main': {
      return { address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for WETH`);
    }
  }
}
