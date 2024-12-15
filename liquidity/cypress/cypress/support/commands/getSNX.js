import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';
import { setEthBalance } from './setEthBalance';

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
      throw new Error(`Unsupported chain ${Cypress.env('chainId')} for SNX whale`);
  }
}

export async function getSNX({ address = Cypress.env('walletAddress'), amount }) {
  console.log('getSNX', { address, amount });
  const config = await getCollateralConfig({ symbol: 'SNX' });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const whale = await getWhale();
  await setEthBalance({ address: whale, balance: 1000 });
  const SNXContract = new ethers.Contract(
    config.tokenAddress,
    [
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 value) returns (bool)',
    ],
    provider
  );

  const oldBalance = parseFloat(ethers.utils.formatUnits(await SNXContract.balanceOf(address)));
  console.log('getSNX', { address, oldBalance });

  if (oldBalance > amount) {
    console.log('getSNX', { result: 'SKIP' });
    return null;
  }

  const whaleBalance = parseFloat(ethers.utils.formatUnits(await SNXContract.balanceOf(whale)));
  console.log('getSNX', { whale, whaleBalance });

  const signer = provider.getSigner(whale);
  const txn = await SNXContract.connect(signer).transfer(
    address,
    ethers.utils.parseEther(`${amount}`)
  );
  const receipt = await txn.wait();
  console.log('getSNX', { txEvents: receipt.events.filter((e) => Boolean(e.event)) });

  const newBalance = parseFloat(ethers.utils.formatUnits(await SNXContract.balanceOf(address)));
  console.log('getSNX', { address, newBalance });
  return receipt;
}
