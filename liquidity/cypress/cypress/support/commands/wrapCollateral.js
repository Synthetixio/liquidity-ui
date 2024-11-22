import { ethers } from 'ethers';
import { importSpotMarketProxy } from '@snx-v3/contracts';
import { getSynthConfig } from './getSynthConfig';

export async function wrapCollateral({ address = Cypress.env('walletAddress'), symbol, amount }) {
  console.log('wrapCollateral', { address, symbol, amount });

  const SpotMarketProxy = await importSpotMarketProxy(
    Cypress.env('chainId'),
    Cypress.env('preset')
  );
  const synthConfig = await getSynthConfig({ symbol });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(Cypress.env('walletAddress'));

  const SpotMarketProxyContract = new ethers.Contract(
    SpotMarketProxy.address,
    SpotMarketProxy.abi,
    signer
  );
  const tx = await SpotMarketProxyContract.wrap(
    synthConfig.synthMarketId,
    ethers.utils.parseUnits(`${amount}`, synthConfig.token.decimals),
    0,
    { gasLimit: 10_000_000 }
  );
  const result = await tx.wait();
  console.log('wrapCollateral', { txEvents: result.events });

  const CollateralContract = new ethers.Contract(
    synthConfig.address,
    ['function balanceOf(address account) view returns (uint256)'],
    signer
  );
  console.log('wrapCollateral', {
    address,
    symbol,
    synthBalance: ethers.utils.formatUnits(await CollateralContract.balanceOf(address), 18),
  });
}
