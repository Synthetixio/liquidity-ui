import { importCoreProxy } from '@snx-v3/contracts';
import { importAllContractErrors, parseContractError } from '@snx-v3/parseContractError';
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

  const args = [
    //
    ethers.BigNumber.from(accountId),
    ethers.BigNumber.from(poolId),
    config.tokenAddress,
    ethers.utils.parseEther(`${amount}`),
  ];
  const gasLimit = await CoreProxyContract.estimateGas.mintUsd(...args).catch(async (error) => {
    console.log(
      'borrowUsd ERROR',
      parseContractError({
        error,
        abi: await importAllContractErrors(Cypress.env('chainId'), Cypress.env('preset')),
      })
    );
    return ethers.BigNumber.from(10_000_000);
  });
  const txn = await CoreProxyContract.mintUsd(...args, { gasLimit: gasLimit.mul(2) });
  const receipt = await txn.wait();
  console.log('borrowUsd', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });

  const debt = await CoreProxyContract.callStatic.getPositionDebt(
    accountId,
    poolId,
    config.tokenAddress
  );
  console.log('borrowUsd', { debt });
  return receipt;
}
