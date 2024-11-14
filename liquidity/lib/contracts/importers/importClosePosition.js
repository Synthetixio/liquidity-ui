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
    case '1-main': {
      // https://etherscan.io/address/0x800b12d24ebb639bce7280861b05149f0d60f99e#code
      return { address: '0x800b12d24ebb639bce7280861b05149f0d60f99e', abi };
    }
    case '11155111-main': {
      // https://sepolia.etherscan.io/address/0xcc998ef6d1923f206be1fed700eb1afebd69fbce#code
      return { address: '0xcc998ef6d1923f206be1fed700eb1afebd69fbce', abi };
    }
    case '42161-main': {
      // https://arbiscan.io/address/0x28551921507790D91260d8eD08E3D688d525A752#code
      return { address: '0x28551921507790D91260d8eD08E3D688d525A752', abi };
    }
    case '421614-main': {
      // https://sepolia.arbiscan.io/address/0x0482BD380d46bCC924f3DD29307ECdAad8fF2a0C#code
      return { address: '0x0482BD380d46bCC924f3DD29307ECdAad8fF2a0C', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for ClosePosition`);
    }
  }
}
