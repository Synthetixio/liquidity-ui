import { ethers } from 'ethers';
import { wei, WeiSource } from '@synthetixio/wei';

export const formatValue = (value: ethers.BigNumberish, decimals = 18) =>
  parseFloat(ethers.utils.formatUnits(value, decimals));

export const parseUnits = (value: WeiSource, decimals = 18) => wei(value, decimals).toBN();

export const compareAddress = (add1: string | null = '', add2: string | null = '') =>
  !!add1 && !!add2 && add1.toLowerCase() === add2.toLowerCase();

export const prettyString = (text: string, startLength = 6, endLength = 4) => {
  if (text.length <= startLength + endLength) {
    return text;
  }
  return `${text.substring(0, startLength)}...${text.substring(text.length - endLength)}`;
};

export function renderAccountId(accountId?: ethers.BigNumber) {
  if (!accountId) {
    return '---';
  }
  const hex = accountId.toHexString();
  // auto-generated 0x80000000000000000000000000000008 value
  if (hex.length === 34) {
    return `${hex.slice(0, 5)}...${hex.slice(-6)}`;
  }
  return `#${accountId}`;
}
