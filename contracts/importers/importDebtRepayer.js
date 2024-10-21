const abi = [
  'function depositDebtToRepay(address synthetixCore, address spotMarket, uint128 accountId, uint128 poolId, address collateralType, uint128 spotMarketId)',
];

export async function importDebtRepayer(chainId, preset) {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      return { address: '0x', abi };
    }
    case '11155111-main': {
      return { address: '0x', abi };
    }
    case '10-main': {
      return { address: '0x', abi };
    }
    case '8453-andromeda': {
      // https://basescan.org/address/0xBD8004ea5c73E33d405d35d594221Efc733F7E37#code
      return { address: '0xBD8004ea5c73E33d405d35d594221Efc733F7E37', abi };
    }
    case '84532-andromeda': {
      // https://sepolia.basescan.org/address/0x0d08ff9e0ceddf81a85bc160d5d378eea7a1e200#code
      return { address: '0x0d08ff9e0ceddf81a85bc160d5d378eea7a1e200', abi };
    }
    case '42161-main': {
      // https://arbiscan.io/address/0x2305f5f9ef3abf0d6d02411aca44f85113b247af#code
      return { address: '0x2305f5f9ef3abf0d6d02411aca44f85113b247af', abi };
    }
    case '421614-main': {
      // https://sepolia.arbiscan.io/address/0xd88de2ee855f145ab1ecfff8273661c3d59fc8ad#code
      return { address: '0xd88de2ee855f145ab1ecfff8273661c3d59fc8ad', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for DebtRepayer`);
    }
  }
}
