import { importCoreProxy } from '@snx-v3/contracts';
import { importAllContractErrors, parseContractError } from '@snx-v3/parseContractError';
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

  const args = [
    //
    ethers.BigNumber.from(accountId),
    ethers.BigNumber.from(poolId),
    config.tokenAddress,
    ethers.utils.parseEther(`${amount}`),
    ethers.utils.parseEther(`1`),
  ];

  const gasLimit = await CoreProxyContract.estimateGas
    .delegateCollateral(...args)
    .catch(async (error) => {
      console.log(
        'delegateCollateral ERROR',
        parseContractError({
          error,
          abi: await importAllContractErrors(Cypress.env('chainId'), Cypress.env('preset')),
        })
      );
      return ethers.BigNumber.from(10_000_000);
    });
  const txn = await CoreProxyContract.delegateCollateral(...args, { gasLimit: gasLimit.mul(2) });
  const receipt = await txn.wait();
  console.log('delegateCollateral', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });
  return receipt;
}
