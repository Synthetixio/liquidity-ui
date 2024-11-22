import { importCoreProxy } from '@snx-v3/contracts';
import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

export async function borrowUsd({
  address = Cypress.env('walletAddress'),
  accountId = Cypress.env('accountId'),
  symbol,
  amount,
  poolId,
}) {
  console.log('borrowUsd', { address, accountId, symbol, amount, poolId });

  const CoreProxy = await importCoreProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const config = await getCollateralConfig({ symbol });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

  const tx = await CoreProxyContract.mintUsd(
    ethers.BigNumber.from(accountId),
    ethers.BigNumber.from(poolId),
    config.tokenAddress,
    ethers.utils.parseEther(`${amount}`),
    { gasLimit: 10_000_000 }
  );
  const result = await tx.wait();
  console.log('borrowUsd', { events: result.events });

  const debt = await CoreProxyContract.callStatic.getPositionDebt(
    accountId,
    poolId,
    config.tokenAddress
  );
  console.log('borrowUsd', { debt });
  return debt;
}
