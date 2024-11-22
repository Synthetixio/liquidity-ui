import { importCoreProxy } from '@snx-v3/contracts';
import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

export async function delegateCollateral({
  address = Cypress.env('walletAddress'),
  accountId = Cypress.env('accountId'),
  symbol,
  amount,
  poolId,
}) {
  console.log('delegateCollateral', { address, accountId, symbol, amount, poolId });

  const CoreProxy = await importCoreProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const config = await getCollateralConfig({ symbol });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
  const tx = await CoreProxyContract.delegateCollateral(
    ethers.BigNumber.from(accountId),
    ethers.BigNumber.from(poolId),
    config.tokenAddress,
    ethers.utils.parseEther(`${amount}`),
    ethers.utils.parseEther(`1`),
    { gasLimit: 10_000_000 }
  );
  const result = await tx.wait();
  console.log('delegateCollateral', { events: result.events });
}
