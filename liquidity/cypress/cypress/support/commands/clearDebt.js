import {
  importDebtRepayer,
  importCoreProxy,
  importSpotMarketProxy,
  importAccountProxy,
  importAllErrors,
} from '@snx-v3/contracts';
import { parseContractError } from '@snx-v3/parseContractError';
import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

export async function clearDebt({
  address = Cypress.env('walletAddress'),
  accountId = Cypress.env('accountId'),
  symbol,
  poolId,
}) {
  console.log('clearDebt', { address, accountId, symbol, poolId });

  const config = await getCollateralConfig({ symbol });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const DebtRepayer = await importDebtRepayer(Cypress.env('chainId'), Cypress.env('preset'));
  const DebtRepayerContract = new ethers.Contract(DebtRepayer.address, DebtRepayer.abi, signer);

  const AccountProxy = await importAccountProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const AccountProxyContract = new ethers.Contract(AccountProxy.address, AccountProxy.abi, signer);

  const CoreProxy = await importCoreProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const SpotMarketProxy = await importSpotMarketProxy(
    Cypress.env('chainId'),
    Cypress.env('preset')
  );

  const USDC = await getCollateralConfig({ symbol: 'USDC' });
  const TokenContract = new ethers.Contract(
    USDC.tokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  );

  await (await TokenContract.approve(DebtRepayer.address, ethers.constants.MaxUint256)).wait();
  await (await AccountProxyContract.approve(DebtRepayer.address, accountId)).wait();

  const args = [
    //
    CoreProxy.address,
    SpotMarketProxy.address,
    AccountProxy.address,
    ethers.BigNumber.from(accountId),
    ethers.BigNumber.from(poolId),
    config.tokenAddress,
    '1', // USDC_BASE_MARKET
  ];

  const gasLimit = await DebtRepayerContract.estimateGas
    .depositDebtToRepay(...args)
    .catch(async (error) => {
      const AllErrors = await importAllErrors(Cypress.env('chainId'), Cypress.env('preset'));
      console.log('clearDebt ERROR', parseContractError({ error, AllErrors }));
      return ethers.BigNumber.from(10_000_000);
    });
  const txn = await DebtRepayerContract.depositDebtToRepay(...args, { gasLimit: gasLimit.mul(2) });
  const receipt = await txn.wait();
  console.log('clearDebt', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });
  return receipt;
}
