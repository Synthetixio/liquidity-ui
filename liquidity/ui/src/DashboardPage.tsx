import { Alert, AlertIcon, Collapse, Flex, Heading, Link, Text } from '@chakra-ui/react';
import { PoolsList } from '@snx-v3/Pools';
import { PositionsList } from '@snx-v3/Positions';
import { Rewards } from '@snx-v3/Rewards';
import { StatsTotalLocked } from '@snx-v3/StatsTotalLocked';
import { StatsTotalPnl } from '@snx-v3/StatsTotalPnl';
import { StataUSDC, Synths } from '@snx-v3/Synths';
import { MAINNET, OPTIMISM, useNetwork } from '@snx-v3/useBlockchain';
import React from 'react';
import { Helmet } from 'react-helmet';

export function DashboardPage() {
  const { network } = useNetwork();
  return (
    <>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix Liquidity V3" />
      </Helmet>
      <Flex pt={{ base: 2, sm: 10 }} flexDir="column" mb={16}>
        <Collapse
          in={network?.id === MAINNET.id || network?.id === OPTIMISM.id}
          animateOpacity
          unmountOnExit
        >
          <Alert status="warning" mb="6">
            <AlertIcon />
            <Text>
              From March 24th the liquidation ratio is being raised on legacy positions.{' '}
              <Link isExternal href="https://420.synthetix.io" color="cyan.500">
                Migrate to 420 Pool immediately.
              </Link>
            </Text>
          </Alert>
        </Collapse>

        <Flex columnGap={20} flexWrap="wrap" justifyContent="space-between">
          <Flex flexDirection="column">
            <Heading
              mt={[6, 10]}
              color="gray.50"
              maxWidth="40rem"
              fontSize={['2rem', '3rem']}
              lineHeight="120%"
            >
              Stake and Earn
            </Heading>
            <Text color="gray.500" fontSize="1rem" lineHeight={6} fontFamily="heading" mt="1rem">
              Deposit SNX to earn a privileged share of protocol performance
            </Text>
          </Flex>
          <Flex mt={10} gap={4} flex={1} flexDirection={['column', 'row']}>
            <StatsTotalLocked />
            <StatsTotalPnl />
          </Flex>
        </Flex>

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
      </Flex>
    </>
  );
}
