import { ethers } from 'ethers';

export async function fetchAccountAvailableCollateral({
  provider,
  CoreProxy,
  accountId,
  collateralTypeTokenAddress,
}: {
  provider: ethers.providers.BaseProvider;
  CoreProxy: { address: string; abi: string[] };
  accountId: ethers.BigNumberish;
  collateralTypeTokenAddress: string;
}) {
  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
  const accountAvailableCollateral = await CoreProxyContract.getAccountAvailableCollateral(
    accountId,
    collateralTypeTokenAddress
  );
  return accountAvailableCollateral;
}
