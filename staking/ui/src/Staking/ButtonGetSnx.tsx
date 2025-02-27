import { ArrowUpIcon } from '@chakra-ui/icons';
import { Button, Link, Text } from '@chakra-ui/react';
import React from 'react';

export function ButtonGetSnx({ ...props }) {
  return (
    <Button
      as={Link}
      isExternal
      href="https://www.coingecko.com/en/coins/synthetix-network-token"
      variant="trasparent"
      borderColor="gray.900"
      color="cyan.500"
      borderWidth="1px"
      width="100%"
      textDecoration="none"
      _hover={{ textDecoration: 'none' }}
      display="flex"
      gap={1}
      {...props}
    >
      <Text>Get SNX</Text>
      <ArrowUpIcon transform="rotate(45deg)" />
    </Button>
  );
}
