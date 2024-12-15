import { importAllErrors, importCoreProxy } from '@snx-v3/contracts';
import { parseContractError } from '@snx-v3/parseContractError';
import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

export async function depositCollateral({
  address = Cypress.env('walletAddress'),
  accountId = Cypress.env('accountId'),
  symbol,
  amount,
}) {
  console.log('depositCollateral', { symbol, amount });

  const CoreProxy = await importCoreProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const config = await getCollateralConfig({ symbol });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

  const args = [
    //
    ethers.BigNumber.from(accountId),
    config.tokenAddress,
    ethers.utils.parseEther(`${amount}`),
  ];
  const gasLimit = await CoreProxyContract.estimateGas.deposit(...args).catch(async (error) => {
    const AllErrors = await importAllErrors(Cypress.env('chainId'), Cypress.env('preset'));
    console.log('delegateCollateral ERROR', parseContractError({ error, AllErrors }));
    return ethers.BigNumber.from(10_000_000);
  });
  const txn = await CoreProxyContract.deposit(...args, { gasLimit: gasLimit.mul(2) });
  const receipt = await txn.wait();
  console.log('depositCollateral', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });
  return receipt;
}
