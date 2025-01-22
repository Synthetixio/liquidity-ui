import { Flex, Skeleton } from '@chakra-ui/react';

export const PoolCardsLoading = () => (
  <>
    {Array.from(Array(3).keys()).map((i) => (
      <Flex
        key={i}
        flexDir="row"
        w="100%"
        border="1px solid"
        borderColor="gray.900"
        rounded="base"
        bg="navy.700"
        py={4}
        px={4}
        gap={4}
        alignItems="center"
      >
        <Flex alignItems="center" justifyContent="flex-start" width="260px" gap={3}>
          <Skeleton width="40px" height="40px" rounded="full" />
          <Flex flex={1} flexDirection="column" gap={1}>
            <Skeleton height="26px" width="50px" />
            <Skeleton height="18px" width="100px" />
          </Flex>
        </Flex>
        <Flex
          justifyContent="flex-end"
          alignItems="flex-end"
          width="240px"
          flexDirection="column"
          gap={1}
        >
          <Skeleton height="26px" width="50px" />
          <Skeleton height="18px" width="70px" />
        </Flex>
        <Flex justifyContent="flex-end" alignItems="center" width="240px">
          <Skeleton height={6} width="92px" />
        </Flex>
        <Flex justifyContent="flex-end" alignItems="center" width="164px">
          <Skeleton height={6} width="92px" />
        </Flex>
      </Flex>
    ))}
  </>
);
