import { ArrowUpIcon } from '@chakra-ui/icons';
import { Button, Divider, Flex, Heading, Image, Link, Text } from '@chakra-ui/react';
import SynthetixLogo from './Synthetix.svg';

export function ClaimSuccessBanner({ onClose }: { onClose: () => void }) {
  return (
    <Flex
      data-cy="claim success"
      flexDir="column"
      gap="6"
      borderColor="gray.900"
      rounded="base"
      height="fit-content"
    >
      <Heading color="gray.50" fontSize="20px" fontWeight={700}>
        What can you do with your sUSD?
      </Heading>
      <Divider />

      <Flex flexWrap="wrap" px={1} alignItems="center" gap={4}>
        <Image src={SynthetixLogo} width={42} />

        <Flex flexDir="column">
          <Text color="white" fontSize="16px" fontWeight={800}>
            Trade L1 Perp
          </Text>
          <Text color="white" fontSize="14px" fontWeight={300}>
            Trade with synthetix integrators
          </Text>
        </Flex>

        <Text ml="auto" color="white" fontSize="12px" fontWeight={800}>
          Coming soon
        </Text>
      </Flex>

      <Flex flexWrap="wrap" px={1} alignItems="center" gap={4} mt={4} mb={2}>
        <Image width="42px" src="/curve.png" alt="Curve" />

        <Flex flexDir="column">
          <Text color="white" fontSize="16px" fontWeight={800}>
            sUSD/USDC Pool
          </Text>
          <Text color="white" fontSize="14px" fontWeight={300}>
            Curve
          </Text>
        </Flex>

        <Button
          as={Link}
          ml="auto"
          size="sm"
          href="https://curve.fi/#/ethereum/pools/factory-stable-ng-258/deposit"
          target="_blank"
          textDecoration="none"
          _hover={{ textDecoration: 'none' }}
          display="flex"
          alignItems="center"
          fontWeight={700}
          gap="2"
        >
          Deposit on Curve{' '}
          <ArrowUpIcon
            style={{
              transform: 'rotate(45deg)',
            }}
          />
        </Button>
      </Flex>

      <Button onClick={onClose} variant="outline" colorScheme="gray" w="100%">
        Later
      </Button>
    </Flex>
  );
}
