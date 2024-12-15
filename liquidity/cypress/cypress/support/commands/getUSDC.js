import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';
import { setEthBalance } from './setEthBalance';

async function getWhale() {
  switch (parseInt(Cypress.env('chainId'))) {
    case 8453:
      return '0x3304E22DDaa22bCdC5fCa2269b418046aE7b566A';
    default:
      throw new Error(`Unsupported chain ${Cypress.env('chainId')} for USDC whale`);
  }
}

export async function getUSDC({ address = Cypress.env('walletAddress'), amount }) {
  console.log('getUSDC', { amount });
  const collateralConfig = await getCollateralConfig({ symbol: 'USDC' });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const whale = await getWhale();
  await setEthBalance({ address: whale, balance: 1000 });
  const USDCContract = new ethers.Contract(
    collateralConfig.address,
    [
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 value) returns (bool)',
    ],
    provider
  );
  const oldBalance = parseFloat(ethers.utils.formatUnits(await USDCContract.balanceOf(address), 6));
  console.log('getUSDC', { address, token: collateralConfig.address, oldBalance });

  if (oldBalance > amount) {
    console.log('getUSDC', { result: 'SKIP' });
    return null;
  }

  const whaleBalance = parseFloat(ethers.utils.formatUnits(await USDCContract.balanceOf(whale), 6));
  console.log('getUSDC', { whale, token: collateralConfig.address, whaleBalance });

  const signer = provider.getSigner(whale);
  const txn = await USDCContract.connect(signer).transfer(
    address,
    ethers.utils.parseUnits(`${amount}`, 6)
  );
  const receipt = await txn.wait();
  console.log('getUSDC', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });

  const newBalance = parseFloat(ethers.utils.formatUnits(await USDCContract.balanceOf(address), 6));
  console.log('getUSDC', { address, token: collateralConfig.address, newBalance });
  return receipt;
}
