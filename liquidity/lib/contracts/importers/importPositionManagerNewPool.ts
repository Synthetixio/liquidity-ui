const abi = [
  'constructor(address CoreProxy_, address AccountProxy_, address TreasuryMarketProxy_, address LegacyMarketProxy_)',
  'function AccountProxy() view returns (address)',
  'function CoreProxy() view returns (address)',
  'function LegacyMarketProxy() view returns (address)',
  'function TreasuryMarketProxy() view returns (address)',
  'function UINT256_MAX() view returns (uint256)',
  'function V2xResolver() view returns (address)',
  'function closePosition(uint128 accountId)',
  'function get$SNX() view returns (address $SNX)',
  'function get$sUSD() view returns (address $sUSD)',
  'function get$snxUSD() view returns (address $snxUSD)',
  'function getAccounts() view returns (uint128[] accountIds)',
  'function getV2x() view returns (address v2x)',
  'function getV2xUsd() view returns (address v2xUsd)',
  'function increasePosition(uint128 accountId, uint256 snxAmount)',
  'function migratePosition(uint128 sourcePoolId, uint128 accountId)',
  'function onERC721Received(address, address, uint256, bytes) pure returns (bytes4)',
  'function repayLoan(uint128 accountId, uint256 susdAmount)',
  'function setupPosition(uint256 snxAmount)',
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
      // https://etherscan.io/address/0x190dc6311258c6d84e60c24b21008c280880de95#code
      return { address: '0x190dc6311258C6D84E60c24b21008C280880dE95', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for PositionManagerNewPool`);
    }
  }
}
