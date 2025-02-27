import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { ButtonDocs } from './ButtonDocs';
import { ButtonGetSnx } from './ButtonGetSnx';
import { ButtonStake } from './ButtonStake';
import { ComingSoon } from './ComingSoon';
import { LayoutWIthCoin } from './LayoutWIthCoin';

export function EmptyV3Debt() {
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
        <>
          <Text fontSize="1.25em">Looks like you don’t have any debt outstanding</Text>
          <Text color="gray.600">
            Mint some debt and migrate now, or check back soon to take advantage of rewards for
            debt-free stakers!
          </Text>

          <ButtonStake />

          <Flex gap={4} justifyContent="space-between">
            <ButtonGetSnx />
            <ButtonDocs />
          </Flex>

          <ComingSoon mt={6} />
        </>
      )}
    />
  );
}
