import { currency } from '@snx-v3/format';
import { wei, Wei } from '@synthetixio/wei';
import { constants } from 'ethers';
import React from 'react';

export function Amount({
  value,
  prefix = '',
  suffix = '',
  'data-cy': testid,
}: {
  prefix?: string;
  value?: Wei;
  suffix?: string;
  'data-cy'?: string;
}) {
  const isMaxUint = value && wei(constants.MaxInt256).lte(value);
  const formattedValue = React.useMemo(() => currency(value), [value]);

  return (
    <span data-cy={testid}>
      {prefix}
      {isMaxUint ? 'Infinite' : formattedValue}
      {!isMaxUint && suffix}
    </span>
  );
}
