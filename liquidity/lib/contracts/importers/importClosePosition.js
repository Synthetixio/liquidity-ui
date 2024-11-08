/*
abi = [{"inputs":[{"internalType":"address","name":"walletAddress","type":"address"},{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"uint256","name":"requiredAllowance","type":"uint256"},{"internalType":"uint256","name":"availableAllowance","type":"uint256"}],"name":"NotEnoughAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"walletAddress","type":"address"},{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"uint256","name":"requiredAmount","type":"uint256"},{"internalType":"uint256","name":"availableAmount","type":"uint256"}],"name":"NotEnoughBalance","type":"error"},{"inputs":[{"internalType":"address","name":"coreProxyAddress","type":"address"},{"internalType":"address","name":"accountProxyAddress","type":"address"},{"internalType":"uint128","name":"accountId","type":"uint128"},{"internalType":"uint128","name":"poolId","type":"uint128"},{"internalType":"address","name":"collateralType","type":"address"}],"name":"closePosition","outputs":[],"stateMutability":"nonpayable","type":"function"}]
Interface = require('ethers').utils.Interface
new Interface(abi).format();
*/

const abi = [
  'error NotEnoughAllowance(address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance)',
  'error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount)',
  'function closePosition(address coreProxyAddress, address accountProxyAddress, uint128 accountId, uint128 poolId, address collateralType)',
];

export async function importClosePosition(chainId, preset) {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '42161-main': {
      // https://arbiscan.io/address/0xc06d3b06e1e6813d60fe3db6ad39c5164205ac0a#code
      return { address: '0xc06d3b06e1e6813d60fe3db6ad39c5164205ac0a', abi };
    }
    case '421614-main': {
      // https://sepolia.arbiscan.io/address/0x35b79ed956064338d3df10abc215ab128c6265be#code
      return { address: '0x35b79ed956064338d3df10abc215ab128c6265be', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for ClosePosition`);
    }
  }
}
