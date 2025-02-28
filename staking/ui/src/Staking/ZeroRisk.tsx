import { InfoIcon } from '@chakra-ui/icons';
import { Flex, Text } from '@chakra-ui/react';
import React from 'react';

export function ZeroRisk({ ...props }) {
  return (
    <Flex direction="row" {...props}>
      <Flex
        direction="row"
        color="gray.700"
        backgroundColor="whiteAlpha.100"
        borderRadius="5px"
        py="1"
        px="3"
        gap={3}
        alignItems="center"
        width="100%"
      >
        <InfoIcon />
        <Text>Your migrated positions will have zero risk of liquidation</Text>
      </Flex>
    </Flex>
  );
}
