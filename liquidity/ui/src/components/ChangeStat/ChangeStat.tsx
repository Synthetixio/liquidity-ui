import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Flex, Text } from '@chakra-ui/react';
import Wei from '@synthetixio/wei';
import React from 'react';

const styles = {
  sm: {
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: '14px',
  },
  md: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '16px',
  },
  lg: {
    fontSize: '18px',
    fontWeight: '800',
    lineHeight: '24px',
  },
};

export function ChangeStat({
  formatFn,
  value,
  newValue,
  hasChanges,
  'data-cy': dataCy,
  withColor,
  size = 'lg',
  isPending,
}: {
  value?: Wei;
  newValue: Wei;
  hasChanges: boolean;
  'data-cy'?: string;
  formatFn: (val?: Wei) => React.ReactNode;
  withColor?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isPending?: boolean;
}) {
  return (
    <Flex
      gap="1"
      alignItems="center"
      color="white"
      fontSize={styles[size].fontSize}
      fontWeight={styles[size].fontWeight}
      lineHeight={styles[size].lineHeight}
      flexWrap="wrap"
      data-cy={dataCy}
    >
      <Text
        data-cy="change stats current"
        textAlign="center"
        opacity={value && value.eq(0) ? '70%' : undefined}
        color={
          withColor && value && value.gt(0)
            ? 'green.700'
            : value && value.lt(0)
              ? 'red.700'
              : 'gray.50'
        }
        whiteSpace="nowrap"
      >
        {isPending ? '~' : formatFn(value)}
      </Text>
      {hasChanges && !isPending && (!value || !value.eq(newValue)) ? (
        <Flex gap="1" alignItems="center" isTruncated>
          <ArrowForwardIcon />
          <Text
            data-cy="change stats new"
            textAlign="center"
            opacity={newValue.eq(0) ? '70%' : undefined}
            color={
              withColor && newValue.gt(0) ? 'green.700' : newValue.lt(0) ? 'red.700' : 'gray.50'
            }
            whiteSpace="nowrap"
          >
            {formatFn(newValue)}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  );
}
