import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { ButtonDocs } from './ButtonDocs';
import { ButtonGetSnx } from './ButtonGetSnx';
import { ButtonStake } from './ButtonStake';
import { ComingSoon } from './ComingSoon';
import { LayoutWithImage } from './LayoutWithImage';
import coin from './coin.webp';

export function EmptyPosition() {
  return (
    <LayoutWithImage
      imageSrc={coin}
      Subheader={() => (
        <Text color="gray.50" fontSize="2em" maxWidth="20em">
          Debt-free staking starts now.
        </Text>
      )}
      Content={() => (
        <>
          <Text color="gray.600">
            Stake SNX on Ethereum Mainnet at up to 500% C-Ratio and then come back to migrate your
            position.
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
