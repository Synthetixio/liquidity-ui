import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';
import { importCoreProxy } from './importCoreProxy';

export async function depositCollateral({ address, accountId, symbol, amount }) {
  const CoreProxy = await importCoreProxy();
  const config = await getCollateralConfig(symbol);
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);
  console.log('depositCollateral', { address, accountId, symbol, amount, config });

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

  const tx = await CoreProxyContract.deposit(
    ethers.BigNumber.from(accountId),
    config.tokenAddress,
    ethers.utils.parseEther(`${amount}`),
    { gasLimit: 10_000_000 }
  );
  await tx.wait();

  return accountId;
}
