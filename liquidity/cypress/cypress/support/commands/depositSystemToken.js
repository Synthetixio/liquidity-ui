import { importCoreProxy, importSystemToken } from '@snx-v3/contracts';
import { importAllContractErrors, parseContractError } from '@snx-v3/parseContractError';
import { ethers } from 'ethers';

export async function depositSystemToken({
  address = Cypress.env('walletAddress'),
  accountId = Cypress.env('accountId'),
  amount,
}) {
  console.log('depositSystemToken', { amount });

  const systemToken = await importSystemToken(Cypress.env('chainId'), Cypress.env('preset'));
  const CoreProxy = await importCoreProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

  const args = [
    //
    ethers.BigNumber.from(accountId),
    systemToken.address,
    ethers.utils.parseEther(`${amount}`),
  ];
  const gasLimit = await CoreProxyContract.estimateGas.deposit(...args).catch(async (error) => {
    console.log(
      'depositSystemToken ERROR',
      parseContractError({
        error,
        abi: await importAllContractErrors(Cypress.env('chainId'), Cypress.env('preset')),
      })
    );
    return ethers.BigNumber.from(10_000_000);
  });
  const txn = await CoreProxyContract.deposit(...args, { gasLimit: gasLimit.mul(2) });
  const receipt = await txn.wait();
  console.log('depositSystemToken', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });
  return receipt;
}
