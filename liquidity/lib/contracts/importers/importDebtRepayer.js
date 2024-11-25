const abi = [
  'function depositDebtToRepay(address synthetixCore, address spotMarket, address accountProxy, uint128 accountId, uint128 poolId, address collateralType, uint128 spotMarketId)',
];

export async function importDebtRepayer(chainId, preset) {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '8453-andromeda': {
      // https://basescan.org/address/0x220bd4ba855a954a57d5eac74ca686e73c58f388#code
      return { address: '0x220bd4ba855a954a57d5eac74ca686e73c58f388', abi };
    }
    case '84532-andromeda': {
      // https://sepolia.basescan.org/address/0x4e41a49dc192b3c31acea9db38be74ac224e7212#code
      return { address: '0x4e41a49dc192b3c31acea9db38be74ac224e7212', abi };
    }
    // Arbitrum contracts cannot be the same as Base as the workflow is different
    //    case '42161-main': {
    //      // https://arbiscan.io/address/0x2305f5f9ef3abf0d6d02411aca44f85113b247af#code
    //      return { address: '0x2305f5f9ef3abf0d6d02411aca44f85113b247af', abi };
    //    }
    //    case '421614-main': {
    //      // https://sepolia.arbiscan.io/address/0xd88de2ee855f145ab1ecfff8273661c3d59fc8ad#code
    //      return { address: '0xd88de2ee855f145ab1ecfff8273661c3d59fc8ad', abi };
    //    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for DebtRepayer`);
    }
  }
}
