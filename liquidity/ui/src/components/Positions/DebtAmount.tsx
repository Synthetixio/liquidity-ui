import { Text, TextProps } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { Wei } from '@synthetixio/wei';

export function DebtAmount({
  debt,
  showPNL,
  ...props
}: TextProps & { debt?: Wei; showPNL?: boolean }) {
  return (
    <Text
      {...props}
      color={debt && debt.lt(0) ? 'green.500' : debt && debt.lt(0) ? 'red.500' : 'white.500'}
    >
      <Amount
        prefix={`${showPNL && debt && debt.gt(0) ? '-' : ''}$`}
        value={debt ? debt.abs() : ZEROWEI}
      />
    </Text>
  );
}
