import { Box, Divider, Flex, Heading, Link } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import { PoolHeader, CollateralSection } from '../components';
import { useParams } from '@snx-v3/useParams';
import { HomeLink } from '@snx-v3/HomeLink';
import { usePool } from '@snx-v3/usePoolsList';
import { NETWORKS } from '@snx-v3/useBlockchain';
import { NavLink } from 'react-router-dom';

export const Pool = () => {
  const { poolId, networkId } = useParams();

  const { data: pool, isPending } = usePool(Number(networkId), String(poolId));
  const network = NETWORKS.find((n) => n.id === Number(networkId));

  const title = pool
    ? `Pool #${pool.poolInfo?.[0]?.pool?.id} / ${pool.poolInfo?.[0]?.pool?.name}`
    : 'Pool';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={title} />
      </Helmet>
      <>
        <HomeLink mt={4} />
        {!isPending && !pool ? (
          <Flex
            height="100%"
            direction="column"
            position="relative"
            alignItems="center"
            justifyContent="center"
            flex="1"
          >
            <Heading fontSize="5xl">Not found</Heading>

            <NavLink to="/">
              <Link color="cyan.500">Return to Home</Link>
            </NavLink>
          </Flex>
        ) : null}
        {!isPending && pool && network ? (
          <>
            <PoolHeader mt={3} name={pool.poolInfo?.[0]?.pool?.name} network={network} />
            <Divider my={6} bg="gray.900" />
            <Flex gap={4} mb={16}>
              <Box w="100%">
                <CollateralSection />
              </Box>
            </Flex>
          </>
        ) : null}
      </>
    </>
  );
};
