const abi = [
  'constructor(address CoreProxy_, address AccountProxy_, address TreasuryMarketProxy_, address $SNX_, address $sUSD_, uint128 poolId_)',
  'function $SNX() view returns (address)',
  'function $sUSD() view returns (address)',
  'function AccountProxy() view returns (address)',
  'function CoreProxy() view returns (address)',
  'function TreasuryMarketProxy() view returns (address)',
  'function UINT256_MAX() view returns (uint256)',
  'function closePosition(uint128 accountId)',
  'function getAccounts() view returns (uint128[] accountIds)',
  'function increasePosition(uint128 accountId, uint256 snxAmount)',
  'function migratePosition(uint128 sourcePoolId, uint128 accountId)',
  'function onERC721Received(address, address, uint256, bytes) pure returns (bytes4)',
  'function poolId() view returns (uint128)',
  'function repayLoan(uint128 accountId, uint256 susdAmount)',
  'function setupPosition(uint256 snxAmount)',
  'function transferableSynthetixBalanceOf(address walletAddress) returns (uint256 amount)',
  'function withdraw(uint128 accountId)',
  'error AccountExists()',
  'error NotEnoughAllowance(address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance)',
  'error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount)',
];

export async function importPositionManagerNewPool(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      // https://etherscan.io/address/0x103416cfCD0D0a32b904Ab4fb69dF6E5B5aaDf2b#code
      return { address: '0x103416cfCD0D0a32b904Ab4fb69dF6E5B5aaDf2b', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for PositionManagerNewPool`);
    }
  }
}
