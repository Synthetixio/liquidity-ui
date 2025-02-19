const abi = [
  'constructor(address CoreProxy_, address AccountProxy_, address SpotMarketProxy_, address $USDC_, address $stataUSDC_, address $synthUSDC_, address $synthStataUSDC_, uint128 synthIdUSDC_, uint128 synthIdStataUSDC_, uint128 poolId_)',
  'function $USDC() view returns (address)',
  'function $stataUSDC() view returns (address)',
  'function $synthStataUSDC() view returns (address)',
  'function $synthUSDC() view returns (address)',
  'function AccountProxy() view returns (address)',
  'function CoreProxy() view returns (address)',
  'function SpotMarketProxy() view returns (address)',
  'function clearDebt(uint128 accountId)',
  'function closePosition(uint128 accountId)',
  'function decreasePosition(uint128 accountId, uint256 usdcAmount)',
  'function getAccounts() view returns (uint128[] accountIds)',
  'function increasePosition(uint128 accountId, uint256 usdcAmount)',
  'function onERC721Received(address, address, uint256, bytes) pure returns (bytes4)',
  'function poolId() view returns (uint128)',
  'function repay(uint128 accountId, uint256 debtAmount)',
  'function setupPosition(uint256 usdcAmount)',
  'function synthIdStataUSDC() view returns (uint128)',
  'function synthIdUSDC() view returns (uint128)',
  'function withdraw(uint128 accountId)',
  'error AccountExists()',
  'error NotEnoughAllowance(address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance)',
  'error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount)',
];

export async function importPositionManagerAndromedaStataUSDC(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '8453-andromeda': {
      // https://basescan.org/address/0x60de47cd0083cdc59fe8860e2be0d90e441484d3#code
      return { address: '0x60de47cd0083cdc59fe8860e2be0d90e441484d3', abi };
    }
    case '84532-andromeda': {
      // https://sepolia.basescan.org/address/0xe4a23fe04128c54f0efcdbbdda6dbb61bc4bae67#code
      return { address: '0xe4a23fe04128c54f0efcdbbdda6dbb61bc4bae67', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for PositionManagerAndromedaStataUSDC`);
    }
  }
}
