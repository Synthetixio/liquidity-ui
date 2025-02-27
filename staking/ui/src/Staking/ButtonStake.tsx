import { ArrowUpIcon } from '@chakra-ui/icons';
import { Button, Link, Text } from '@chakra-ui/react';
import React from 'react';

export function ButtonStake({ ...props }) {
  return (
    <Button
      as={Link}
      isExternal
      href="https://liquidity.synthetix.io/?collateralSymbol=SNX&manageAction=deposit&page=position"
      display="flex"
      alignItems="center"
      textDecoration="none"
      _hover={{ textDecoration: 'none' }}
      gap={1}
      {...props}
    >
      <Text>Stake</Text>
      <ArrowUpIcon transform="rotate(45deg)" />
    </Button>
  );
}
