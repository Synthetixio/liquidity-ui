import Wei, { wei } from '@synthetixio/wei';
import { constants } from 'ethers';
import numbro from 'numbro';
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

  const formattedValue = React.useMemo(() => {
    if (!value) {
      return '-';
    }
    if (value.eq(0)) {
      return '0.00';
    }
    const m2 = numbro(value.toNumber()).format({
      thousandSeparated: true,
      mantissa: 2,
    });
    const m0 = numbro(value.toNumber()).format({
      thousandSeparated: true,
      mantissa: 0,
    });
    // Strip unnecessary .00
    return parseFloat(m2) === parseFloat(m0) ? m0 : m2;
  }, [value]);

  return (
    <span data-cy={testid}>
      {prefix}
      {isMaxUint ? 'Infinite' : formattedValue}
      {!isMaxUint && suffix}
    </span>
  );
}
