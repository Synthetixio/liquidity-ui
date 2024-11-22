import { importMeta } from '@snx-v3/contracts';
import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

export async function approveCollateral({
  address = Cypress.env('walletAddress'),
  symbol,
  spender,
}) {
  console.log('approveCollateral', { address, symbol, spender });

  const meta = await importMeta(Cypress.env('chainId'), Cypress.env('preset'));
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);
  const config = await getCollateralConfig({ symbol });

  const contract = new ethers.Contract(
    config.tokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  );

  const tx = await contract.approve(meta.contracts[spender], ethers.constants.MaxUint256);
  const result = await tx.wait();
  console.log('approveCollateral', { txEvents: result.events.filter((e) => Boolean(e.event)) });
}
