const abi = [
  'function depositDebtToRepay(address synthetixCore, address spotMarket, address accountProxy, uint128 accountId, uint128 poolId, address collateralType, uint128 spotMarketId)',
];

export async function importDebtRepayer(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '8453-andromeda': {
      // https://basescan.org/address/0x624f2aB0f1DFF2297b9eca320898381Fbba4E3E3#code
      return { address: '0x624f2aB0f1DFF2297b9eca320898381Fbba4E3E3', abi };
    }
    case '84532-andromeda': {
      // https://sepolia.basescan.org/address/0xe4b0233F06a308B4732282e24ce7aE0c87bdEcbc#code
      return { address: '0xe4b0233F06a308B4732282e24ce7aE0c87bdEcbc', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for DebtRepayer`);
    }
  }
}
