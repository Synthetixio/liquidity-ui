import { ArrowUpIcon } from '@chakra-ui/icons';
import { Button, Link, Text } from '@chakra-ui/react';
import React from 'react';

export function ButtonDocs({ ...props }) {
  return (
    <Button
      as={Link}
      isExternal
      href="https://mirror.xyz/kain.eth/8UX6Rn5wpTli0WCCC_fWC7vOAQPiOTDGrUI87mrhkvc"
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
      <Text>Learn More</Text>
      <ArrowUpIcon transform="rotate(45deg)" />
    </Button>
  );
}
