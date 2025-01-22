import { currency } from '@snx-v3/format';
import { Tooltip } from '@snx-v3/Tooltip';
import Wei, { wei } from '@synthetixio/wei';
import { constants } from 'ethers';
import { useMemo } from 'react';

export function Amount({
  value,
  prefix = '',
  suffix = '',
  'data-cy': testid,
  showTooltip,
}: {
  prefix?: string;
  value?: Wei;
  suffix?: string;
  'data-cy'?: string;
  showTooltip?: boolean;
}) {
  const { formattedValue, preciseValue, isMaxUint } = useMemo(() => {
    if (!value) {
      return { formattedValue: '-', preciseValue: '-' };
    }

    const formattedValue = value.eq(0) ? '0.00' : currency(value);
    const cleanNumber = wei(formattedValue.replaceAll(',', ''));

    return {
      isMaxUint: wei(constants.MaxInt256).lte(value),
      formattedValue,
      preciseValue: value.eq(cleanNumber) ? formattedValue : value.toString(),
    };
  }, [value]);

  return (
    <Tooltip
      label={
        <>
          {isMaxUint ? (
            'You cannot borrow against this collateral'
          ) : (
            <>
              {prefix}
              {preciseValue}
              {suffix}
            </>
          )}
        </>
      }
      isDisabled={formattedValue === preciseValue || !showTooltip}
    >
      <span data-cy={testid}>
        {prefix}
        {isMaxUint ? 'Infinite' : formattedValue}
        {!isMaxUint && suffix}
      </span>
    </Tooltip>
  );
}
