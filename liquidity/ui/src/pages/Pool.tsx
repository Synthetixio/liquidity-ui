import { Box, Divider, Flex, Heading, Link } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import { PoolHeader, CollateralSection } from '../components';
import { useParams } from '@snx-v3/useParams';
import { HomeLink } from '@snx-v3/HomeLink';
import { usePool } from '@snx-v3/usePoolsList';
import { MAINNET, NETWORKS } from '@snx-v3/useBlockchain';
import { NavLink } from 'react-router-dom';

export const Pool = () => {
  const { poolId, networkId } = useParams();

  const { data: pool, isLoading } = usePool(Number(networkId), String(poolId));
  const network = NETWORKS.find((n) => n.id === Number(networkId));

  const { poolInfo } = pool || {};

  const title = poolInfo ? `Pool #${poolInfo[0].pool.id} / ${poolInfo[0].pool.name}` : 'Pool';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={title} />
      </Helmet>
      <>
        <HomeLink mt={4} />
        {!isLoading && !pool && (
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
        )}
        {!isLoading && pool && (
          <>
            <PoolHeader
              mt={3}
              name={poolInfo && poolInfo[0].pool.name}
              network={network || MAINNET}
            />
            <Divider my={6} bg="gray.900" />
            <Flex gap={4} mb={16}>
              <Box w="100%">
                <CollateralSection />
              </Box>
            </Flex>
          </>
        )}
      </>
    </>
  );
};
