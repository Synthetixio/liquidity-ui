import { Flex, Spinner, Text } from '@chakra-ui/react';
import React from 'react';
import { LayoutWithImage } from './LayoutWithImage';
import coin from './coin.webp';

export function Loading() {
  return (
    <LayoutWithImage
      imageSrc={coin}
      Subheader={() => (
        <Text color="gray.50" fontSize="2em" maxWidth="20em">
          Debt-free staking starts now.
        </Text>
      )}
      Content={() => (
        <Flex
          minHeight="10em"
          flex={1}
          direction="column"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" />
        </Flex>
      )}
    />
  );
}
