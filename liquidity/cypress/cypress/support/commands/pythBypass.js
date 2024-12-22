import { ethers } from 'ethers';

export async function pythBypass() {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  await provider.send('hardhat_setCode', [
    '0x1234123412341234123412341234123412341234',
    ethers.utils.hexlify(ethers.utils.toUtf8Bytes('FORK')),
  ]);
  return true;
}
