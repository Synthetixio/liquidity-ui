import { ethers } from 'ethers';
import { importCoreProxy } from './importCoreProxy';
import { getCollateralConfig } from './getCollateralConfig';

export async function borrowUsd({ address, accountId, symbol, amount, poolId }) {
  const CoreProxy = await importCoreProxy();
  const config = await getCollateralConfig(symbol);
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const signer = provider.getSigner(address);

  console.log('borrowUsd', { address, accountId, symbol, amount, poolId });

  const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

  const tx = await CoreProxyContract.mintUsd(
    ethers.BigNumber.from(accountId),
    ethers.BigNumber.from(poolId),
    config.tokenAddress,
    ethers.utils.parseEther(`${amount}`),
    { gasLimit: 10_000_000 }
  );
  await tx.wait();

  const positionDebt = await CoreProxyContract.callStatic.getPositionDebt(
    accountId,
    poolId,
    config.tokenAddress
  );

  return parseFloat(ethers.utils.formatUnits(positionDebt));
}
