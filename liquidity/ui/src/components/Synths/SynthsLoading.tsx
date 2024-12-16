import { Skeleton, SkeletonCircle, Td, Text, Tr } from '@chakra-ui/react';

export const SynthsLoading = () => (
  <Tr>
    <Td pl="16px" border="none">
      <SkeletonCircle
        startColor="whiteAlpha.500"
        endColor="whiteAlpha.200"
        height={30}
        width={30}
      />
    </Td>
    <Td pl="16px" border="none">
      <Skeleton startColor="whiteAlpha.500" endColor="whiteAlpha.200" height="30px">
        <Text fontSize="14px" fontFamily="heading" fontWeight={500} lineHeight="20px">
          &nbsp;
        </Text>
      </Skeleton>
    </Td>
  </Tr>
);
