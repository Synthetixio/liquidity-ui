import { Flex, Heading, Image, Text } from '@chakra-ui/react';
import { LogoIcon } from '@snx-v3/icons';
import React from 'react';
import CoinImage from './coin.webp';

export function LayoutWIthCoin({
  Subheader,
  Content,
}: {
  Subheader: () => React.ReactNode;
  Content: () => React.ReactNode;
}) {
  return (
    <Flex
      direction="column"
      borderColor="gray.900"
      borderWidth="1px"
      borderRadius="5px"
      bg="navy.700"
    >
      <Flex direction="row" flexWrap="wrap" gap={4}>
        <Flex direction="column" flex={{ base: 2, sm: 2, md: 2, lg: 1 }} p={6} gap={6}>
          <Heading
            as={Flex}
            alignItems="center"
            gap={4}
            fontSize="20px"
            lineHeight="1.75rem"
            color="gray.50"
            fontWeight={700}
          >
            <LogoIcon />
            <Text>SNX Debt Jubilee</Text>
          </Heading>

          <Subheader />

          <Flex
            flex={1}
            borderColor="gray.900"
            borderWidth="1px"
            borderRadius="5px"
            p={6}
            direction="column"
            gap={4}
          >
            <Content />
          </Flex>
        </Flex>
        <Flex
          flex={{ base: 0, sm: 0, md: 1 }}
          direction="column"
          display={{ base: 'none', sm: 'none', md: 'flex' }}
          position="relative"
          overflow="hidden"
        >
          <Image
            rounded="5px"
            src={CoinImage}
            width="100%"
            height="100%"
            objectFit="cover"
            // position="absolute"
            // bottom="0"
            // right="0"
            style={{
              maskImage: 'linear-gradient(270deg, #000000 50%, rgba(0, 0, 0, 0) 100%)',
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
