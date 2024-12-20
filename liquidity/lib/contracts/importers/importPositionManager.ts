const abi = [
  'function clearDebt(address coreProxyAddress, address accountProxyAddress, uint128 accountId, uint128 poolId, address collateralType)',
  'function closePosition(address coreProxyAddress, address accountProxyAddress, uint128 accountId, uint128 poolId, address collateralType)',
  'function decreasePosition(address coreProxyAddress, address accountProxyAddress, uint128 accountId, uint128 poolId, address collateralType, uint256 amount)',
  'function increasePosition(address coreProxyAddress, address accountProxyAddress, uint128 accountId, uint128 poolId, address collateralType, uint256 amount)',
  'function onERC721Received(address, address, uint256, bytes) pure returns (bytes4)',
  'function repay(address coreProxyAddress, address accountProxyAddress, uint128 accountId, uint128 poolId, address collateralType, uint256 debtAmount)',
  'function setupPosition(address coreProxyAddress, address accountProxyAddress, uint128 accountId, uint128 poolId, address collateralType, uint256 amount)',
  'error NotEnoughAllowance(address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance)',
  'error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount)',
];

export async function importPositionManager(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      // https://etherscan.io/address/0x21e9D735Db12221a787317954bDdD7144353b5D7#code
      return { address: '0x21e9D735Db12221a787317954bDdD7144353b5D7', abi };
    }
    case '11155111-main': {
      // https://sepolia.etherscan.io/address/0xfaa4d64521db83195b5b3ff502812b267dde4a53#code
      return { address: '0xfaa4d64521db83195b5b3ff502812b267dde4a53', abi };
    }
    case '42161-main': {
      // https://arbiscan.io/address/0x42c7720912fdc1cdff1f73ff0eee5f0af8522491#code
      return { address: '0x42c7720912fdc1cdff1f73ff0eee5f0af8522491', abi };
    }
    case '421614-main': {
      // https://sepolia.arbiscan.io/address/0xa86339a1ce701b0c708a56cae3d5142f675e1540#code
      return { address: '0xa86339a1ce701b0c708a56cae3d5142f675e1540', abi };
    }
    case '10-main': {
      // https://optimistic.etherscan.io/address/0x8D99de5C3528883fcb9cCFa8E13ffF6330e45CDB#code
      return { address: '0x8D99de5C3528883fcb9cCFa8E13ffF6330e45CDB', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for ClosePosition`);
    }
  }
}
