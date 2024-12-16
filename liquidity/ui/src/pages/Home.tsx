import { Flex, Heading, Text } from '@chakra-ui/react';
import { MAINNET, SEPOLIA, useNetwork } from '@snx-v3/useBlockchain';
import { Helmet } from 'react-helmet';
import { MigrationBanner } from '../components/Migration/MigrationBanner';
import { PoolsList } from '../components/Pools/PoolsList';

export function Home() {
  const { network } = useNetwork();

  return (
    <>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix V3 - Dashboard" />
      </Helmet>
      <Flex overflow="auto" flexDir="column" mb={16}>
        <Heading
          mt={[6, 10]}
          color="gray.50"
          maxWidth="20rem"
          fontSize={['2rem', '3rem']}
          lineHeight="120%"
        >
          The Liquidity Layer of DeFi
        </Heading>
        <Text color="gray.500" fontSize="1rem" lineHeight={6} fontFamily="heading" mt="1rem">
          Provide liquidity for the next generation of permissionless protocols
        </Text>
        <PoolsList />

        {network && [MAINNET.id, SEPOLIA.id].includes(network.id) ? (
          <MigrationBanner network={network} type="banner" />
        ) : null}
      </Flex>
    </>
  );
}
