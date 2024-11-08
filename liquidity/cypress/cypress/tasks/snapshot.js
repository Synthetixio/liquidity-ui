import { ethers } from 'ethers';

export async function evmSnapshot() {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const snapshot = await provider.send('evm_snapshot', []);
  console.log('evm_snapshot', { snapshot });
  return snapshot;
}

export async function evmRevert(snapshot) {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  console.log('evm_revert', { snapshot });
  await provider.send('evm_revert', [snapshot]);
  return null;
}
