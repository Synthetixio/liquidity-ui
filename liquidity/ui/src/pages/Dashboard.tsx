import { Flex, Heading, Text } from '@chakra-ui/react';
// import { SNXJubilee } from '@snx-v3/SNXJubilee';
import { StatsTotalLocked } from '@snx-v3/StatsTotalLocked';
import { StatsTotalPnl } from '@snx-v3/StatsTotalPnl';
import { MAINNET, SEPOLIA, useNetwork } from '@snx-v3/useBlockchain';
import { Helmet } from 'react-helmet';
import { MigrationBanner } from '../components/Migration/MigrationBanner';
import { PoolsList } from '../components/Pools/PoolsList';
import { PositionsList } from '../components/Positions/PositionsList';
import { Rewards } from '../components/Rewards/Rewards';
import { StataUSDC } from '../components/Synths/StataUSDC';
import { Synths } from '../components/Synths/Synths';

export function Dashboard() {
  const { network } = useNetwork();
  return (
    <>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix Liquidity V3" />
      </Helmet>
      <Flex pt={{ base: 2, sm: 10 }} flexDir="column" mb={16}>
        {network && [MAINNET.id, SEPOLIA.id].includes(network.id) && (
          <MigrationBanner network={network} type="alert" />
        )}

        <Flex columnGap={20} flexWrap="wrap" justifyContent="space-between">
          <Flex flexDirection="column" minWidth={400}>
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
          </Flex>
          <Flex mt={10} gap={4} flex={1}>
            <StatsTotalLocked />
            <StatsTotalPnl />
          </Flex>
        </Flex>

        {/*
        {network?.id === MAINNET.id ? (
          <Box mt={12}>
            <SNXJubilee />
          </Box>
        ) : null}
        */}

        <Flex mt={12} flexDirection="column" gap={4}>
          <Heading fontSize="1.25rem" fontFamily="heading" lineHeight="1.75rem">
            Positions
          </Heading>
          <PositionsList />
        </Flex>

        <Flex mt={6} flexDirection={['column', 'column', 'row']} gap={4}>
          <Flex
            flex={1}
            flexDirection="column"
            borderColor="gray.900"
            borderWidth="1px"
            borderRadius="5px"
            p={6}
            sx={{
              borderCollapse: 'separate !important',
              borderSpacing: 0,
            }}
            bg="navy.700"
          >
            <Rewards />
          </Flex>

          <Flex
            flex={1}
            flexDirection="column"
            borderColor="gray.900"
            borderWidth="1px"
            borderRadius="5px"
            p={6}
            sx={{
              borderCollapse: 'separate !important',
              borderSpacing: 0,
            }}
            bg="navy.700"
          >
            <Synths />
            <StataUSDC />
          </Flex>
        </Flex>

        <Flex mt={12} flexDirection="column">
          <Heading fontSize="1.25rem" fontFamily="heading" lineHeight="1.75rem">
            Vaults
          </Heading>
          <PoolsList />
        </Flex>

        {network && [MAINNET.id, SEPOLIA.id].includes(network.id) ? (
          <MigrationBanner network={network} type="banner" />
        ) : null}
      </Flex>
    </>
  );
}
