import { InfoIcon } from '@chakra-ui/icons';
import { Fade, Flex, Text } from '@chakra-ui/react';
import { Tooltip } from '@snx-v3/Tooltip';
import { ReactNode } from 'react';
import { SynthSkeleton } from '../SynthSkeleton/SynthSkeleton';

interface StatBoxProps {
  isLoading: boolean;
  title: string;
  label?: string | ReactNode;
  value?: ReactNode;
}

export const StatBox = ({ isLoading, title, label, value }: StatBoxProps) => {
  return (
    <Flex
      bg="navy.700"
      border="1px solid"
      borderColor="gray.900"
      rounded="base"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      minWidth="200px"
      flex={1}
      height="160px"
      px={6}
      py={4}
    >
      <Flex alignItems="center" mb={1}>
        <Text fontSize="14px" color="gray.500" mr={1}>
          {title}
        </Text>
        {label && (
          <Tooltip label={label} p={3} mt={1}>
            <InfoIcon w="10px" h="10px" />
          </Tooltip>
        )}
      </Flex>
      <Flex w="100%" justifyContent="center" alignItems="center">
        <SynthSkeleton
          isLoaded={!isLoading}
          height="24px"
          minWidth={isLoading ? '40%' : 'initial'}
          startColor="gray.700"
          endColor="navy.800"
        >
          <Fade in>
            <Text
              fontSize="24px"
              lineHeight="24px"
              fontWeight={800}
              data-cy="stats box"
              data-title={title}
            >
              {value || '$0.00'}
            </Text>
          </Fade>
        </SynthSkeleton>
      </Flex>
    </Flex>
  );
};
