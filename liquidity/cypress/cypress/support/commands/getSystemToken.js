import { importCoreProxy, importSystemToken } from '@snx-v3/contracts';
import { ethers } from 'ethers';
import { setEthBalance } from './setEthBalance';

export async function getSystemToken({ address = Cypress.env('walletAddress'), amount }) {
  const systemToken = await importSystemToken(Cypress.env('chainId'), Cypress.env('preset'));
  console.log('getSystemToken', { address, amount, config: systemToken });

  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const CoreProxy = await importCoreProxy(Cypress.env('chainId'), Cypress.env('preset'));
  const whale = CoreProxy.address; // Core always has plenty of system token
  await setEthBalance({ address: whale, balance: 1 });
  const TokenContract = new ethers.Contract(
    systemToken.address,
    [
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 value) returns (bool)',
    ],
    provider
  );

  const oldBalance = parseFloat(ethers.utils.formatUnits(await TokenContract.balanceOf(address)));
  console.log('getSystemToken', { address, oldBalance });

  if (oldBalance > amount) {
    console.log('getSystemToken', { result: 'SKIP' });
    return null;
  }

  const whaleBalance = parseFloat(ethers.utils.formatUnits(await TokenContract.balanceOf(whale)));
  console.log('getSystemToken', { whale, whaleBalance });

  const signer = provider.getSigner(whale);
  const txn = await TokenContract.connect(signer).transfer(
    address,
    ethers.utils.parseEther(`${amount}`)
  );
  const receipt = await txn.wait();
  console.log('getSystemToken', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });

  const newBalance = parseFloat(ethers.utils.formatUnits(await TokenContract.balanceOf(address)));
  console.log('getSystemToken', { address, newBalance });
  return receipt;
}
