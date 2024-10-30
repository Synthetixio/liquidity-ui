import { ethers } from 'ethers';
import crypto from 'crypto';
import { importCoreProxy } from './importCoreProxy';

export async function createAccount({ address }) {
  const CoreProxy = await importCoreProxy();

  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const coreProxy = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

  const accountId = parseInt(`1337${crypto.randomInt(1000)}`);

  const currentAccountOwner = await coreProxy.getAccountOwner(accountId);
  console.log('createAccount', { accountId, currentAccountOwner });

  const tx = await coreProxy['createAccount(uint128)'](accountId, { gasLimit: 10_000_000 });
  await tx.wait();

  const newAccountOwner = await coreProxy.getAccountOwner(accountId);
  console.log('createAccount', { accountId, newAccountOwner });

  return accountId;
}
