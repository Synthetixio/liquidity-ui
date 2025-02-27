import { Flex, Spinner, Text } from '@chakra-ui/react';
import React from 'react';
import { LayoutWIthCoin } from './LayoutWIthCoin';

export function Loading() {
  return (
    <LayoutWIthCoin
      Subheader={() => (
        <Text color="gray.50" fontSize="2em" maxWidth="20em">
          Debt-free staking starts now. Migrate & earn{' '}
          <Text as="span" fontWeight="700" color="green.500">
            40%+
          </Text>{' '}
          APR in debt forgiveness
        </Text>
      )}
      Content={() => (
        <Flex minHeight="10em" direction="column" alignItems="center" justifyContent="center">
          <Spinner size="xl" />
        </Flex>
      )}
    />
  );
}
