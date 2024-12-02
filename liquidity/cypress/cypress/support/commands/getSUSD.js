import { ethers } from 'ethers';
import { setEthBalance } from './setEthBalance';
import { importSystemToken } from '@snx-v3/contracts';

export async function getWhale() {
  switch (parseInt(Cypress.env('chainId'))) {
    case 1:
      return '0xffffffaEff0B96Ea8e4f94b2253f31abdD875847'; // Synthetix: Deployer
    case 5:
      return '0x48914229dedd5a9922f44441ffccfc2cb7856ee9';
    case 10:
      return '0x5Fc9B8d2B7766f061bD84a41255fD1A76Fd1FAa2'; // ImportableRewardEscrowV2
    case 420:
      return '0x48914229dedd5a9922f44441ffccfc2cb7856ee9';
    default:
      throw new Error(`Unsupported chain ${Cypress.env('chainId')} for sUSD whale`);
  }
}

export async function getSUSD({ address = Cypress.env('walletAddress'), amount }) {
  const config = await importSystemToken(Cypress.env('chainId'), Cypress.env('preset'));
  console.log('getSUSD', { address, amount, config });

  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const whale = await getWhale();
  await setEthBalance({ address: whale, balance: 1000 });
  const sUSDContract = new ethers.Contract(
    config.address,
    [
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 value) returns (bool)',
    ],
    provider
  );

  const oldBalance = parseFloat(ethers.utils.formatUnits(await sUSDContract.balanceOf(address)));
  console.log('getSUSD', { address, oldBalance });

  if (oldBalance > amount) {
    console.log('getSUSD', { result: 'SKIP' });
    return null;
  }

  const whaleBalance = parseFloat(ethers.utils.formatUnits(await sUSDContract.balanceOf(whale)));
  console.log('getSUSD', { whale, whaleBalance });

  const signer = provider.getSigner(whale);
  const tx = await sUSDContract
    .connect(signer)
    .transfer(address, ethers.utils.parseEther(`${amount}`));
  const result = await tx.wait();
  console.log('getSUSD', { txEvents: result.events.filter((e) => Boolean(e.event)) });

  const newBalance = parseFloat(ethers.utils.formatUnits(await sUSDContract.balanceOf(address)));
  console.log('getSUSD', { address, newBalance });
}
