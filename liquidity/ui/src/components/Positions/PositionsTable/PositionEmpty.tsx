import { Flex, Button, Text, Link } from '@chakra-ui/react';
import { makeSearch, useParams } from '@snx-v3/useParams';

export const PositionsEmpty = () => {
  const [params, setParams] = useParams();
  return (
    <Flex justifyContent="space-between" alignItems="baseline" w="100%">
      <Text color="gray.500" fontWeight={500} fontSize="14px" my="4" pl="3">
        You can open a new position by browsing the different Pools and choosing a vault for
        collateral type
      </Text>
      <Link
        href={`?${makeSearch({ page: 'dashboard', accountId: params.accountId })}`}
        onClick={(e) => {
          e.preventDefault();
          setParams({ page: 'dashboard', accountId: params.accountId });
        }}
      >
        <Button size="sm" data-cy="all pools button">
          Explore all Pools
        </Button>
      </Link>
    </Flex>
  );
};
