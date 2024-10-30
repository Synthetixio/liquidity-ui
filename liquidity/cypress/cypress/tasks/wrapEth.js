import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

const erc20Abi = [
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
  'function deposit() payable',
];

export async function wrapEth({ address, amount }) {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const WETH = await getCollateralConfig('WETH');
  const WETHContract = new ethers.Contract(WETH.tokenAddress, erc20Abi, signer);
  const balance = parseFloat(ethers.utils.formatUnits(await WETHContract.balanceOf(address)));

  if (balance >= amount) {
    console.log('wrapEth', { balance });
    console.log('wrapEth', { result: 'SKIP' });
    return balance;
  }

  const wrapTx = await WETHContract.deposit({
    value: ethers.utils.hexValue(ethers.utils.parseEther(`${amount}`).toHexString()),
  });
  await wrapTx.wait();
  const newBalance = parseFloat(ethers.utils.formatUnits(await WETHContract.balanceOf(address)));
  console.log('wrapEth', { balance: newBalance });
  console.log('wrapEth', { result: 'OK' });
  return newBalance;
}
