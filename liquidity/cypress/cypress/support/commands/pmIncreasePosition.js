import {
  importAccountProxy,
  importPositionManagerAndromedaStataUSDC,
  importPositionManagerAndromedaUSDC,
} from '@snx-v3/contracts';
import { importAllContractErrors, parseContractError } from '@snx-v3/parseContractError';
import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

export async function pmIncreasePosition({
  address = Cypress.env('walletAddress'),
  accountId = Cypress.env('accountId'),
  symbol,
  amount,
}) {
  console.log('increasePosition', { accountId, symbol, amount });

  const PositionManager =
    symbol === 'stataUSDC'
      ? await importPositionManagerAndromedaStataUSDC(Cypress.env('chainId'), Cypress.env('preset'))
      : await importPositionManagerAndromedaUSDC(Cypress.env('chainId'), Cypress.env('preset'));

  const AccountProxy = await importAccountProxy(Cypress.env('chainId'), Cypress.env('preset'));

  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const AccountProxyContract = new ethers.Contract(AccountProxy.address, AccountProxy.abi, signer);
  const txnApproveAccount = await AccountProxyContract.approve(PositionManager.address, accountId);
  const receiptApproveAccount = await txnApproveAccount.wait();
  console.log('decreasePosition approve Account', {
    txEvents: receiptApproveAccount.events.filter((e) => Boolean(e.event)),
  });

  const collateralTypeUSDC = await getCollateralConfig({ symbol: 'USDC' });
  const TokenContract = new ethers.Contract(
    collateralTypeUSDC.tokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  );
  const txnApprove = await TokenContract.approve(
    PositionManager.address,
    ethers.constants.MaxUint256
  );
  const receiptApprove = await txnApprove.wait();
  console.log('increasePosition approve USDC', {
    txEvents: receiptApprove.events.filter((e) => Boolean(e.event)),
  });

  const PositionManagerContract = new ethers.Contract(
    PositionManager.address,
    PositionManager.abi,
    signer
  );

  const args = [
    //
    ethers.BigNumber.from(accountId),
    ethers.utils.parseUnits(`${amount}`, collateralTypeUSDC.decimals),
  ];
  const gasLimit = await PositionManagerContract.estimateGas
    .increasePosition(...args)
    .catch(async (error) => {
      console.log(
        'increasePosition ERROR',
        parseContractError({
          error,
          abi: await importAllContractErrors(Cypress.env('chainId'), Cypress.env('preset')),
        })
      );
      return ethers.BigNumber.from(10_000_000);
    });
  const txn = await PositionManagerContract.increasePosition(...args, {
    gasLimit: gasLimit.mul(2),
  });
  const receipt = await txn.wait();
  console.log('increasePosition', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });

  return receipt;
}
