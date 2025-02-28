import { Button, Text } from '@chakra-ui/react';
import { useWallet } from '@snx-v3/useBlockchain';
import React from 'react';

export function ButtonConnect({ ...props }) {
  const { connect } = useWallet();
  return (
    <Button
      display="flex"
      alignItems="center"
      textDecoration="none"
      _hover={{ textDecoration: 'none' }}
      gap={1}
      onClick={() => connect()}
      {...props}
    >
      <Text>Connect Wallet</Text>
    </Button>
  );
}
