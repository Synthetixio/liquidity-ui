import { Button, Flex, Link, Text } from '@chakra-ui/react';
import { makeSearch, useParams } from '@snx-v3/useParams';

export const PositionsEmpty = () => {
  const [params, setParams] = useParams();
  return (
    <Flex justifyContent="space-between" alignItems="baseline" w="100%">
      <Text color="gray.500" fontWeight={500} fontSize="14px" my="4" pl="3">
        You can open a new position by choosing a vault for collateral type
      </Text>
      <Button
        as={Link}
        href={`?${makeSearch({ accountId: params.accountId })}`}
        onClick={(e) => {
          e.preventDefault();
          setParams({ accountId: params.accountId });
        }}
        size="sm"
        data-cy="all pools button"
      >
        Explore all Vaults
      </Button>
    </Flex>
  );
};
