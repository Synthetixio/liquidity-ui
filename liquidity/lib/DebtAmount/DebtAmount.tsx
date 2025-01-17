import { Text, TextProps } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { Wei } from '@synthetixio/wei';

export function getDebtColor(debt?: Wei) {
  if (!debt) {
    return 'gray.50';
  }
  if (debt.gt(0)) {
    return 'white.500';
  }
  if (debt.lt(0)) {
    return 'green.500';
  }
  return 'white.500';
}

export function PnlAmount({ debt, ...props }: TextProps & { debt?: Wei }) {
  return (
    <Text as="span" {...props} color={getDebtColor(debt)}>
      <Amount prefix={`${debt && debt.gt(0) ? '-' : ''}$`} value={debt ? debt.abs() : ZEROWEI} />
    </Text>
  );
}

export function DebtAmount({ debt, ...props }: TextProps & { debt?: Wei }) {
  return (
    <Text as="span" {...props} color={getDebtColor(debt)}>
      <Amount prefix={`${debt && debt.lt(0) ? '-' : ''}$`} value={debt ? debt.abs() : ZEROWEI} />
    </Text>
  );
}
