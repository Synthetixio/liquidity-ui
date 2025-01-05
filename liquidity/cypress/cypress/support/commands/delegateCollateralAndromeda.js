import {
  importAccountProxy,
  importAllErrors,
  importCoreProxy,
  importDebtRepayer,
  importTrustedMulticallForwarder,
  importSpotMarketProxy,
} from '@snx-v3/contracts';
import { parseContractError } from '@snx-v3/parseContractError';
import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';

export async function delegateCollateralAndromeda({
  address = Cypress.env('walletAddress'),
  accountId = Cypress.env('accountId'),
  symbol,
  amount,
  poolId,
}) {
  console.log('delegateCollateral', { address, accountId, symbol, amount, poolId });

  const config = await getCollateralConfig({ symbol });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  const AllErrors = await importAllErrors(Cypress.env('chainId'), Cypress.env('preset'));

  const Multicall3 = await importTrustedMulticallForwarder(
    Cypress.env('chainId'),
    Cypress.env('preset')
  );
  const Multicall3Contract = new ethers.Contract(Multicall3.address, Multicall3.abi, signer);

  const CoreProxy = await importCoreProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxy.abi);

  const DebtRepayer = await importDebtRepayer(Cypress.env('chainId'), Cypress.env('preset'));
  const DebtRepayerInterface = new ethers.utils.Interface(DebtRepayer.abi);

  const AccountProxy = await importAccountProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const AccountProxyContract = new ethers.Contract(AccountProxy.address, AccountProxy.abi, signer);

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

  console.log(`DebtRepayer.address`, DebtRepayer.address);

  const depositDebtToRepayTx = {
    target: DebtRepayer.address,
    callData: DebtRepayerInterface.encodeFunctionData('depositDebtToRepay', [
      //
      CoreProxy.address,
      SpotMarketProxy.address,
      AccountProxy.address,
      ethers.BigNumber.from(accountId),
      ethers.BigNumber.from(poolId),
      config.tokenAddress,
      '1', // USDC_BASE_MARKET
    ]),
    requireSuccess: true,
  };
  console.log(`depositDebtToRepayTx`, depositDebtToRepayTx);
  const delegateCollateralTx = {
    target: CoreProxy.address,
    callData: CoreProxyInterface.encodeFunctionData('delegateCollateral', [
      //
      ethers.BigNumber.from(accountId),
      ethers.BigNumber.from(poolId),
      config.tokenAddress,
      ethers.utils.parseEther(`${amount}`),
      ethers.utils.parseEther(`1`),
    ]),
    requireSuccess: true,
  };
  console.log(`delegateCollateralTx`, delegateCollateralTx);
  const args = [
    //
    [
      depositDebtToRepayTx.target,
      depositDebtToRepayTx.requireSuccess,
      depositDebtToRepayTx.callData,
    ],
    [
      delegateCollateralTx.target,
      delegateCollateralTx.requireSuccess,
      delegateCollateralTx.callData,
    ],
  ];

  try {
    await Multicall3Contract.estimateGas.aggregate3(args);
  } catch (error) {
    console.log(
      'delegateCollateral estimateGas ERROR',
      parseContractError({
        error,
        AllErrors,
      })
    );
    throw error;
  }

  try {
    const txn = await Multicall3Contract.aggregate3(args);
    console.log('delegateCollateral txn', txn);
    const receipt = await txn.wait();
    console.log('delegateCollateral receipt', txn);
    return receipt;
  } catch (error) {
    console.log(
      'delegateCollateral sendTransaction ERROR',
      parseContractError({
        error,
        AllErrors,
      })
    );
    throw error;
  }
}
