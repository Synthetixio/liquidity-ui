import { Flex } from '@chakra-ui/react';
import React from 'react';

export function InfoBox({ ...props }) {
  return (
    <Flex
      alignItems="center"
      borderWidth={1}
      borderRadius={4}
      px={2}
      py={0}
      gap={2}
      height="1.75em"
      color="gray.500"
      fontWeight="500"
      {...props}
    />
  );
}
