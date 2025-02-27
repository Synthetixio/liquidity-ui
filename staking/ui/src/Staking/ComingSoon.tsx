import { Flex, Text } from '@chakra-ui/react';
import React from 'react';

export function ComingSoon({ ...props }) {
  return (
    <Flex direction="row" justifyContent="center" alignItems="center" {...props}>
      <Flex
        direction="row"
        color="gray.700"
        backgroundColor="whiteAlpha.100"
        borderRadius="full"
        p="4px 12px 4px 4px"
        gap={3}
        fontSize="0.75em"
      >
        <Text
          p="2px 8px"
          backgroundColor="blackAlpha.500"
          textTransform="uppercase"
          fontWeight="bold"
          borderRadius="full"
        >
          Coming soon
        </Text>
        <Text p="2px">Stake directly into the new pool</Text>
      </Flex>
    </Flex>
  );
}
