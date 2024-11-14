import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:fetchPositionDebt');

export async function fetchPositionDebt({
  provider,
  CoreProxy,
  accountId,
  poolId,
  collateralTypeTokenAddress,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxy: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  poolId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
}) {
  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
  const positionDebt = await CoreProxyContract.callStatic.getPositionDebt(
    accountId,
    poolId,
    collateralTypeTokenAddress
  );
  log('positionDebt: %O', positionDebt);
  return positionDebt;
}
