import { Badge, Button, Flex, Td, Text, Tr } from '@chakra-ui/react';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { SynthCircle, SynthSkeleton } from '../../../../lib/SynthSkeleton/SynthSkeleton';

export function PositionsRowLoading() {
  return (
    <Tr>
      <Td border="none">
        <Flex alignItems="center">
          <SynthCircle>
            <TokenIcon symbol="SNX" />
          </SynthCircle>
          <Flex flexDirection="column" ml={3}>
            <SynthSkeleton height="1rem" mb={1} width="70%">
              <Text color="white" fontWeight={700} lineHeight="1.25rem" fontFamily="heading">
                sUSDC
              </Text>
            </SynthSkeleton>
            <SynthSkeleton height="0.75rem">
              <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
                Synthetic USDC
              </Text>
            </SynthSkeleton>
          </Flex>
        </Flex>
      </Td>

      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          <SynthSkeleton height="1rem" mb={1}>
            <Text color="white" fontWeight={700} lineHeight="1.25rem" fontFamily="heading">
              $100,000
            </Text>
          </SynthSkeleton>
          <SynthSkeleton height="0.75rem">
            <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
              200 SNX
            </Text>
          </SynthSkeleton>
        </Flex>
      </Td>

      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          <SynthSkeleton height="1rem" mb={1}>
            <Text color="white" fontWeight={700} lineHeight="1.25rem" fontFamily="heading">
              $100,000
            </Text>
          </SynthSkeleton>
          <SynthSkeleton height="0.75rem">
            <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
              200 SNX
            </Text>
          </SynthSkeleton>
        </Flex>
      </Td>
      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          <SynthSkeleton height="1rem" mb={1} width="70%">
            <Text color="white" fontWeight={700} lineHeight="1.25rem" fontFamily="heading">
              $20,000
            </Text>
          </SynthSkeleton>
          <SynthSkeleton height="0.75rem">
            <Text color="cyan.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
              Claim Credit
            </Text>
          </SynthSkeleton>
        </Flex>
      </Td>
      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          <SynthSkeleton height="1rem" mb={1}>
            <Text color="white" fontWeight={700} lineHeight="1.25rem" fontFamily="heading">
              5000%
            </Text>
          </SynthSkeleton>
          <SynthSkeleton height="0.75rem">
            <Badge colorScheme="green" border="1px solid" bg="green.900">
              HEALTHY
            </Badge>
          </SynthSkeleton>
        </Flex>
      </Td>
      <Td border="none">
        <Flex flexDirection="column">
          <SynthSkeleton height="1.75rem">
            <Button
              fontSize="0.75rem"
              lineHeight="1rem"
              height="1.75rem"
              fontWeight={700}
              borderWidth="1px"
              borderColor="gray.900"
              borderRadius="4px"
              disabled
            >
              Manage
            </Button>
          </SynthSkeleton>
        </Flex>
      </Td>
    </Tr>
  );
}
