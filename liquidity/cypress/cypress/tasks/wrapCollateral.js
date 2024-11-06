import { ethers } from 'ethers';
import { importSpotMarketProxy } from './importSpotMarketProxy';
import { getSynthConfig } from './getSynthConfig';

export async function wrapCollateral({ address, symbol, amount }) {
  const SpotMarketProxy = await importSpotMarketProxy();
  const config = await getSynthConfig(symbol);
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  console.log('wrapCollateral', { amount, token: config.token.symbol, signer });

  const SpotMarketProxyContract = new ethers.Contract(
    SpotMarketProxy.address,
    SpotMarketProxy.abi,
    signer
  );
  const wrapTx = await SpotMarketProxyContract.wrap(
    config.synthMarketId,
    ethers.utils.parseUnits(`${amount}`, config.token.decimals),
    0
  );
  await wrapTx.wait();

  const CollateralContract = new ethers.Contract(
    config.address,
    ['function balanceOf(address account) view returns (uint256)'],
    signer
  );

  console.log('wrapCollateral', {
    collateral: config.symbol,
    balance: ethers.utils.formatUnits(await CollateralContract.balanceOf(address), 18),
    address,
  });

  return null;
}
