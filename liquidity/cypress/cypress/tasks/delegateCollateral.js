import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';
import { importCoreProxy } from './importCoreProxy';

export async function delegateCollateral({ address, accountId, symbol, amount, poolId }) {
  const CoreProxy = await importCoreProxy();
  const config = await getCollateralConfig(symbol);
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);
  console.log('delegateCollateral', { address, accountId, symbol, amount, poolId });

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
  try {
    const tx = await CoreProxyContract.delegateCollateral(
      ethers.BigNumber.from(accountId),
      ethers.BigNumber.from(poolId),
      config.tokenAddress,
      ethers.utils.parseEther(`${amount}`),
      ethers.utils.parseEther(`1`),
      { gasLimit: 10_000_000 }
    );
    await tx.wait();
    return accountId;
  } catch (error) {
    console.log('error: ', error);
    return false;
  }
}
