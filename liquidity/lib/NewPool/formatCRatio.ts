import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';

export function formatCRatio(cRatio?: ethers.BigNumber) {
  return cRatio ? `${parseFloat(wei(cRatio).mul(100).toString()).toFixed(0)}%` : '-';
}
