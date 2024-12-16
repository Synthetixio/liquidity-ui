import { ArrowBackIcon } from '@chakra-ui/icons';
import { Box, Divider, Flex, Heading, Link } from '@chakra-ui/react';
import { NETWORKS } from '@snx-v3/useBlockchain';
import { PoolPageSchema, useParams } from '@snx-v3/useParams';
import { usePool } from '@snx-v3/usePoolsList';
import { Helmet } from 'react-helmet';
import { Link as ReactRouterLink, NavLink } from 'react-router-dom';
import { CollateralSection } from '../components/Pools/CollateralSection';
import { PoolHeader } from '../components/Pools/PoolHeader';

export const Pool = () => {
  const [params] = useParams();
  const safeParams = PoolPageSchema.safeParse(params);
  const networkId = safeParams.success ? Number(safeParams.data.networkId) : undefined;
  const { data: pool, isPending } = usePool(networkId);
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
        <Link
          as={ReactRouterLink}
          px={3}
          py={2}
          width="fit-content"
          display="flex"
          alignItems="center"
          variant="outline"
          lineHeight="20px"
          color="white"
          borderRadius="4px"
          borderWidth="1px"
          borderColor="gray.900"
          _hover={{ textTransform: 'none', opacity: 0.9 }}
          to="/"
          fontSize="sm"
          fontWeight={700}
          mt={4}
          mb={2}
        >
          <ArrowBackIcon mr={1} /> All Pools
        </Link>
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
