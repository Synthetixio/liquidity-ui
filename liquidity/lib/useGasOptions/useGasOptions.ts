import type { BigNumber } from '@ethersproject/bignumber';
import { GAS_LIMIT_MULTIPLIER, GWEI_DECIMALS } from '@snx-v3/constants';
import { wei } from '@synthetixio/wei';

// Note it looks like gas limit estimation is coming in higher slightly higher than what gets used according to etherscan
// Will try without a buffer, if we get user report of out of gas we can increase it again.
const GAS_LIMIT_BUFFER = wei(GAS_LIMIT_MULTIPLIER, GWEI_DECIMALS);

function addGasLimitBuffer(gasLimit?: BigNumber) {
  return wei(gasLimit ?? 0, GWEI_DECIMALS)
    .mul(GAS_LIMIT_BUFFER)
    .toBN();
}

export function formatGasPriceForTransaction({ gasLimit }: { gasLimit: BigNumber }) {
  return { gasLimit: addGasLimitBuffer(gasLimit) };
}
