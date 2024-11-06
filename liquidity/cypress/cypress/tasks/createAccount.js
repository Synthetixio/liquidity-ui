import { ethers } from 'ethers';
import { importCoreProxy } from './importCoreProxy';

export async function createAccount({ address, accountId }) {
  const CoreProxy = await importCoreProxy();

  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

  const currentAccountOwner = await CoreProxyContract.getAccountOwner(accountId);
  console.log('createAccount', { accountId, currentAccountOwner });

  if (currentAccountOwner === address) {
    return accountId;
  }

  const tx = await CoreProxyContract['createAccount(uint128)'](accountId, { gasLimit: 10_000_000 });
  await tx.wait();

  const newAccountOwner = await CoreProxyContract.getAccountOwner(accountId);
  console.log('createAccount', { accountId, newAccountOwner });

  return accountId;
}
