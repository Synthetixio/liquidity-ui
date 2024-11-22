import { ethers } from 'ethers';
import { getCollateralConfig } from './getCollateralConfig';
import { setEthBalance } from './setEthBalance';

async function getWhale() {
  switch (parseInt(Cypress.env('chainId'))) {
    case 8453:
      return '0xd34ea7278e6bd48defe656bbe263aef11101469c'; // Circle
    default:
      throw new Error(`Unsupported chain ${Cypress.env('chainId')} for USDC whale`);
  }
}

export async function getUSDC({ address = Cypress.env('walletAddress'), amount }) {
  console.log('getUSDC', { amount });
  const config = await getCollateralConfig({ symbol: 'USDC' });
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const whale = await getWhale();
  await setEthBalance({ address: whale, balance: 1000 });
  const USDCContract = new ethers.Contract(
    config.address,
    [
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 value) returns (bool)',
    ],
    provider
  );
  const oldBalance = parseFloat(ethers.utils.formatUnits(await USDCContract.balanceOf(address)));
  console.log('getUSDC', { address, oldBalance });

  if (oldBalance > amount) {
    console.log('getUSDC', { result: 'SKIP' });
    return null;
  }

  const whaleBalance = parseFloat(ethers.utils.formatUnits(await USDCContract.balanceOf(whale)));
  console.log('getUSDC', { whale, whaleBalance });

  const signer = provider.getSigner(whale);
  const tx = await USDCContract.connect(signer).transfer(
    address,
    ethers.utils.parseEther(`${amount}`)
  );
  const result = await tx.wait();
  console.log('getUSDC', { txEvents: result.events });

  const newBalance = parseFloat(ethers.utils.formatUnits(await USDCContract.balanceOf(address)));
  console.log('getUSDC', { address, newBalance });
}
