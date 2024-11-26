import { Box, Divider, Flex, Heading, Link } from '@chakra-ui/react';
import { HomeLink } from '@snx-v3/HomeLink';
import { NETWORKS, useNetwork } from '@snx-v3/useBlockchain';
import { useParams } from '@snx-v3/useParams';
import { usePool } from '@snx-v3/usePoolsList';
import { Helmet } from 'react-helmet';
import { NavLink } from 'react-router-dom';
import { CollateralSection, PoolHeader } from '../components';

export const Pool = () => {
  const params = useParams();

  const { network: connectedNetwork } = useNetwork();
  const networkId = params.networkId ? Number(params.networkId) : connectedNetwork?.id;
  const { data: pool, isPending } = usePool(networkId, String(params.poolId));
  const network = NETWORKS.find((n) => n.id === networkId);

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
            <PoolHeader />
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
