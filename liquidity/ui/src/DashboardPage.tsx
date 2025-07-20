import { Alert, AlertIcon, Collapse, Flex, Link, Text } from '@chakra-ui/react';
import { Rewards } from '@snx-v3/Rewards';
import { StataUSDC, SUSD, Synths } from '@snx-v3/Synths';
import { useWallet } from '@snx-v3/useBlockchain';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useMigrationData } from './useMigrationData';

export function DashboardPage() {
  const { activeWallet } = useWallet();
  const walletAddress = activeWallet?.address;
  const { data: migrationData } = useMigrationData({ walletAddress });
  return (
    <>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix Liquidity V3" />
      </Helmet>
      <Flex pt={{ base: 2, sm: 10 }} flexDir="column" mb={16}>
        <Collapse in={Boolean(migrationData?.address)} animateOpacity unmountOnExit>
          <Alert status="error" mb="6">
            <AlertIcon />
            <Text>
              We’ve recently deprecated solo staking and your account was impacted. Please create a
              ticket in discord and the team will help recover your account
            </Text>
          </Alert>
        </Collapse>

        <Alert status="warning" mb="6">
          <AlertIcon />
          <Text>
            Legacy positions on Ethereum, Optimism and Base have been refunded or{' '}
            <Link isExternal href="https://420.synthetix.io" color="cyan.500">
              migrated to 420.
            </Link>
          </Text>
        </Alert>

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
            <SUSD />
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
