import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchPositionDebtWithPriceUpdate');

export async function fetchPositionDebtWithPriceUpdate({
  provider,
  CoreProxy,
  Multicall3,
  accountId,
  poolId,
  collateralTypeTokenAddress,
  priceUpdateTxn,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxy: { address: string; abi: string[] };
  Multicall3: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
  priceUpdateTxn: {
    target: string;
    callData: string;
    value: ethers.BigNumberish;
    requireSuccess: boolean;
  };
}) {
  // const CoreProxyInterface = new ethers.Contract(CoreProxyContract.address, CoreProxyContract.abi, provider);
  const CoreProxyInterface = new ethers.utils.Interface(CoreProxy.abi);
  const MulticallInterface = new ethers.utils.Interface(Multicall3.abi);

  await new Promise((ok) => setTimeout(ok, 500));

  const getPositionDebtTxn = {
    target: CoreProxy.address,
    callData: CoreProxyInterface.encodeFunctionData('getPositionDebt', [
      accountId,
      poolId,
      collateralTypeTokenAddress,
    ]),
    value: 0,
    requireSuccess: true,
  };
  // const Multicall = new ethers.Contract(MulticallContract.address, MulticallContract.abi, provider);

  const response = await provider.call({
    to: Multicall3.address,
    data: MulticallInterface.encodeFunctionData('aggregate3Value', [
      [priceUpdateTxn, getPositionDebtTxn],
    ]),
    value: priceUpdateTxn.value,
  });
  log('response: %O', response);

  if (response) {
    const decodedMulticall = MulticallInterface.decodeFunctionResult('aggregate3Value', response);
    log('decodedMulticall: %O', decodedMulticall);
    if (decodedMulticall?.returnData?.[1]?.returnData) {
      const getPositionDebtTxnData = decodedMulticall.returnData[1].returnData;
      log('getPositionDebtTxnData: %O', getPositionDebtTxnData);
      const positionDebt = CoreProxyInterface.decodeFunctionResult(
        'getPositionDebt',
        getPositionDebtTxnData
      );
      log('positionDebt: %O', positionDebt);
      return positionDebt.debt;
    }
    console.error({ decodedMulticall });
    throw new Error('Unexpected multicall response');
  }
  throw new Error('Empty multicall response');
}
