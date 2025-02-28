import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { ButtonDocs } from './ButtonDocs';
import { ButtonGetSnx } from './ButtonGetSnx';
import { ButtonStake } from './ButtonStake';
import coin from './coin.webp';
import { LayoutWithImage } from './LayoutWithImage';

export function EmptyV3Debt() {
  return (
    <LayoutWithImage
      imageSrc={coin}
      Subheader={() => (
        <Text color="gray.50" fontSize="2em" maxWidth="20em">
          Debt-free staking coming soon.
        </Text>
      )}
      Content={() => (
        <>
          <ButtonStake />

          <Flex gap={4} justifyContent="space-between">
            <ButtonGetSnx />
            <ButtonDocs />
          </Flex>
        </>
      )}
    />
  );
}
