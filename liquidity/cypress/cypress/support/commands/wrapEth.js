import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

export async function wrapEth({ address = Cypress.env('walletAddress'), amount }) {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const WETH = await getCollateralConfig({ symbol: 'WETH' });
  const WETHContract = new ethers.Contract(
    WETH.tokenAddress,
    [
      'function symbol() view returns (string)',
      'function balanceOf(address) view returns (uint256)',
      'function deposit() payable',
    ],
    signer
  );
  const oldBalance = parseFloat(ethers.utils.formatUnits(await WETHContract.balanceOf(address)));
  console.log('wrapEth', { address, oldBalance });

  if (oldBalance >= amount) {
    console.log('wrapEth', { result: 'SKIP' });
    return oldBalance;
  }

  const tx = await WETHContract.deposit({
    value: ethers.utils.hexValue(ethers.utils.parseEther(`${amount}`).toHexString()),
  });
  const result = await tx.wait();
  console.log('wrapEth', { txEvents: result.events.filter((e) => Boolean(e.event)) });

  const newBalance = parseFloat(ethers.utils.formatUnits(await WETHContract.balanceOf(address)));
  console.log('wrapEth', { address, newBalance });
  return newBalance;
}
