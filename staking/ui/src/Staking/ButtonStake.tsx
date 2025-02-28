import { Button, Text } from '@chakra-ui/react';
import React from 'react';

export function ButtonStake({ ...props }) {
  return (
    <Button
      display="flex"
      alignItems="center"
      textDecoration="none"
      isDisabled={true}
      _hover={{ textDecoration: 'none' }}
      gap={1}
      {...props}
    >
      <Text>Coming Soon</Text>
    </Button>
  );
}
