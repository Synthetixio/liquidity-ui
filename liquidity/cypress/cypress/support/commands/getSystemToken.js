import { ethers } from 'ethers';
import { setEthBalance } from './setEthBalance';
import { importSystemToken } from '@snx-v3/contracts';

export async function getWhale() {
  switch (parseInt(Cypress.env('chainId'))) {
    case 1:
      // sUSD
      // https://etherscan.io/token/0xb2F30A7C980f052f02563fb518dcc39e6bf38175#balances
      return '0x99F4176EE457afedFfCB1839c7aB7A030a5e4A92';
    case 10:
      // snxUSD
      // https://optimistic.etherscan.io/token/0xb2F30A7C980f052f02563fb518dcc39e6bf38175#balances
      return '0xffffffaEff0B96Ea8e4f94b2253f31abdD875847';
    case 8453:
      // snxUSD
      // https://basescan.org/token/0x09d51516F38980035153a554c26Df3C6f51a23C3#balances
      return '0xD25215758734dd3aDE497CE04De1c35820964126';
    case 42161:
      // USDx
      // https://arbiscan.io/token/0xb2F30A7C980f052f02563fb518dcc39e6bf38175#balances
      return '0x096A8865367686290639bc50bF8D85C0110d9Fea';
    default:
      throw new Error(`Unsupported chain ${Cypress.env('chainId')} for V3 USD Token whale`);
  }
}

export async function getSystemToken({ address = Cypress.env('walletAddress'), amount }) {
  const config = await importSystemToken(Cypress.env('chainId'), Cypress.env('preset'));
  console.log('getSystemToken', { address, amount, config });

  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  const whale = await getWhale();
  await setEthBalance({ address: whale, balance: 1000 });
  const TokenContract = new ethers.Contract(
    config.address,
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
