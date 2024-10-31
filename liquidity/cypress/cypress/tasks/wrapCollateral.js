import { ethers } from 'ethers';
import { importSpotMarketProxy } from './importSpotMarketProxy';
import { getSynthConfig } from './getSynthConfig';

export async function wrapCollateral({ privateKey, symbol, amount }) {
  const spotMarketProxy = await importSpotMarketProxy();
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const wallet = new ethers.Wallet(privateKey, provider);
  const config = await getSynthConfig(symbol);
  console.log('approveCollateral', {
    wallet: wallet.address,
    symbol,
    config: config.name,
  });

  console.log('wrap token', {
    amount,
    token: config.token.symbol,
  });

  const spotMarketProxyContract = new ethers.Contract(
    spotMarketProxy.address,
    spotMarketProxy.abi,
    wallet
  );
  const wrapTx = await spotMarketProxyContract.wrap(
    config.synthMarketId,
    ethers.utils.parseUnits(`${amount}`, config.token.decimals),
    0
  );
  await wrapTx.wait();

  const collateral = new ethers.Contract(
    config.address,
    ['function balanceOf(address account) view returns (uint256)'],
    wallet
  );

  console.log({
    collateral: config.symbol,
    balance: ethers.utils.formatUnits(await collateral.balanceOf(wallet.address), 18),
    wallet: wallet.address,
  });

  return null;
}
