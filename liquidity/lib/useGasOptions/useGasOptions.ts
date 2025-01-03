import type { BigNumber } from '@ethersproject/bignumber';
import { GAS_LIMIT_MULTIPLIER, GWEI_DECIMALS } from '@snx-v3/constants';
import type { GasPrices } from '@snx-v3/useGasPrice';
import { wei } from '@synthetixio/wei';

// Note it looks like gas limit estimation is coming in higher slightly higher than what gets used according to etherscan
// Will try without a buffer, if we get user report of out of gas we can increase it again.
const GAS_LIMIT_BUFFER = wei(GAS_LIMIT_MULTIPLIER, GWEI_DECIMALS);

function addGasLimitBuffer(gasLimit?: BigNumber) {
  return wei(gasLimit ?? 0, GWEI_DECIMALS)
    .mul(GAS_LIMIT_BUFFER)
    .toBN();
}

export function formatGasPriceForTransaction({
  gasPrices,
  gasSpeed,
  gasLimit,
}: {
  gasPrices: GasPrices;
  gasSpeed: keyof GasPrices;
  gasLimit: BigNumber;
}) {
  const gasPrice = gasPrices[gasSpeed];
  if (gasPrice && 'baseFeePerGas' in gasPrice) {
    const { baseFeePerGas: _baseFeePerGas, ...gasPriceToReturn } = gasPrice;
    return { ...gasPriceToReturn, gasLimit: addGasLimitBuffer(gasLimit) };
  }
  return { ...gasPrice, gasLimit: addGasLimitBuffer(gasLimit) };
}
