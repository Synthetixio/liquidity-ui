import { ethers } from 'ethers';

export async function setEthBalance({ address, balance }) {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const oldBalance = parseFloat(ethers.utils.formatUnits(await provider.getBalance(address)));
  console.log('setEthBalance', { address, oldBalance });

  const delta = balance - oldBalance;
  if (delta > 0) {
    const signer = provider.getSigner(0);
    const tx = await signer.sendTransaction({
      to: address,
      value: ethers.utils.parseEther(delta.toString()),
    });
    await tx.wait();
  }

  const newBalance = parseFloat(ethers.utils.formatUnits(await provider.getBalance(address)));
  console.log('setEthBalance', { address, newBalance });
  return newBalance;
}
