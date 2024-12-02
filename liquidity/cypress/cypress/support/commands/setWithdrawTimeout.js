import { importCoreProxy } from '@snx-v3/contracts';
import { ethers } from 'ethers';

export async function setWithdrawTimeout(timeout) {
  console.log('WithdrawTimeout', { timeout });

  const CoreProxy = await importCoreProxy(Cypress.env('chainId'), Cypress.env('preset'));

  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
  const owner = await CoreProxyContract.owner();
  const signer = provider.getSigner(owner);

  const tx = await CoreProxyContract.connect(signer).setConfig(
    ethers.utils.formatBytes32String('accountTimeoutWithdraw'),
    ethers.utils.formatBytes32String(timeout)
  );
  await tx.wait();

  const accountTimeoutWithdraw = await CoreProxyContract.getConfig(
    ethers.utils.formatBytes32String('accountTimeoutWithdraw')
  );

  console.log('accountTimeoutWithdraw', {
    accountTimeoutWithdraw: accountTimeoutWithdraw.toString(),
  });
}
