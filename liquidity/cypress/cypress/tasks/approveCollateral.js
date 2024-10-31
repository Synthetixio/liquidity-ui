import { ethers } from 'ethers';
import { importCoreProxy } from './importCoreProxy';
import { getCollateralConfig } from './getCollateralConfig';
import { importSpotMarketProxy } from './importSpotMarketProxy';

export async function approveCollateral({ address, target, symbol }) {
  let spender = '';
  if (target === 'spotMarket') {
    spender = (await importSpotMarketProxy()).address;
  } else {
    spender = (await importCoreProxy()).address;
  }
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);
  const config = await getCollateralConfig(symbol);
  console.log('approveCollateral', { wallet: address, symbol });

  const contract = new ethers.Contract(
    config.tokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  );

  const tx = await contract.approve(spender, ethers.constants.MaxUint256);
  await tx.wait();
  return null;
}
