import { Text } from '@chakra-ui/react';
import React from 'react';

export function SubheaderMigrateAndEarn({ apy }: { apy: React.ReactNode }) {
  return (
    <>
      <Text color="gray.50" fontSize="36px">
        Welcome to your final burn.
      </Text>

      <Text color="gray.50" fontSize="24px">
        Migrate & earn up to{' '}
        <Text as="span" fontWeight="700" color="green.500">
          {apy}
        </Text>{' '}
        APY in debt forgiveness
      </Text>
    </>
  );
}
