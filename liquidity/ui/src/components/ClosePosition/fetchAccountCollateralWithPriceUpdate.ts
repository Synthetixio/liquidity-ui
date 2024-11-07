import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchAccountCollateralWithPriceUpdate');

export async function fetchAccountCollateralWithPriceUpdate({
  provider,
  CoreProxyContract,
  MulticallContract,
  accountId,
  collateralTypeTokenAddress,
  priceUpdateTxn,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxyContract: { address: string; abi: string[] };
  MulticallContract: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxyContract.abi);
  const MulticallInterface = new ethers.utils.Interface(MulticallContract.abi);

  const getAccountCollateralTxn = {
    target: CoreProxyContract.address,
    callData: CoreProxyInterface.encodeFunctionData('getAccountCollateral', [
      accountId,
      collateralTypeTokenAddress,
    ]),
    value: 0,
    requireSuccess: true,
  };

  const response = await provider.call({
    to: MulticallContract.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [
      [priceUpdateTxn, getAccountCollateralTxn],
    ]),
    value: priceUpdateTxn.value,
  });
  log('response: %O', response);

  if (response) {
    const decodedMulticall = MulticallInterface.decodeFunctionResult('aggregate3Value', response);
    log('decodedMulticall: %O', decodedMulticall);
    if (decodedMulticall?.returnData?.[1]?.returnData) {
      const getAccountCollateralTxnData = decodedMulticall.returnData[1].returnData;
      log('getAccountCollateralTxnData: %O', getAccountCollateralTxnData);
      const accountCollateral = CoreProxyInterface.decodeFunctionResult(
        'getAccountCollateral',
        getAccountCollateralTxnData
      );
      log('accountCollateral: %O', accountCollateral);
      return {
        totalAssigned: accountCollateral.totalAssigned,
        totalDeposited: accountCollateral.totalDeposited,
        totalLocked: accountCollateral.totalLocked,
      };
    }
    console.error({ decodedMulticall });
    throw new Error('Unexpected multicall response');
  }
  throw new Error('Empty multicall response');
}
