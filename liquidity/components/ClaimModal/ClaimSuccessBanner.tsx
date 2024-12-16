import { ArrowUpIcon } from '@chakra-ui/icons';
import { Button, Divider, Flex, Heading, Image, Link, Text } from '@chakra-ui/react';

export function ClaimSuccessBanner({ onClose }: { onClose: () => void }) {
  return (
    <Flex flexDir="column" gap="6" borderColor="gray.900" rounded="base" height="fit-content">
      <Heading color="gray.50" fontSize="20px" fontWeight={700}>
        What can you do with your sUSD?
      </Heading>
      <Divider />

      <Flex flexWrap="wrap" alignItems="center" gap={4}>
        <svg width="42" fill="none" viewBox="0 0 340 240" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#00D1FF"
            d="M82.148 55.92q-3.564-4.081-8.786-4.083H2.134c-.632 0-1.15-.2-1.54-.6-.396-.395-.594-.84-.594-1.319v-48Q0 1.201.594.601C.984.2 1.502 0 2.134 0H77.4c18.992 0 35.377 7.764 49.149 23.28l18.283 22.317-35.614 43.44zm131.54-32.88Q234.345 0 263.073 0h75.029q.948.001 1.425.478.471.483.473 1.44v48c0 .478-.16.924-.473 1.318q-.477.6-1.425.6h-71.227c-3.483 0-6.41 1.364-8.787 4.083l-52.471 63.839 52.708 64.316c2.377 2.565 5.221 3.844 8.55 3.844h71.227q.948 0 1.425.6c.313.401.473.924.473 1.557v48c0 .478-.16.924-.473 1.318q-.477.6-1.425.601h-75.029q-28.73.001-49.149-23.28l-43.684-53.278-43.691 53.278q-20.658 23.281-49.385 23.28H2.134c-.632 0-1.112-.201-1.425-.601-.32-.401-.473-.917-.473-1.563v-48c0-.478.154-.918.473-1.318.313-.401.793-.601 1.425-.601h71.228c3.323 0 6.25-1.356 8.786-4.082l51.52-62.876z"
          />
        </svg>

        <Flex flexDir="column">
          <Text color="white" fontSize="16px" fontWeight={800}>
            Trade L1 Perp
          </Text>
          <Text color="white" fontSize="14px" fontWeight={300}>
            Trade with synthetix integrators
          </Text>
        </Flex>

        <Text ml="auto" mr="1" color="white" fontSize="12px" fontWeight={800}>
          Coming soon
        </Text>
      </Flex>

      <Flex flexWrap="wrap" alignItems="center" gap={4} mt={4} mb={2}>
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
