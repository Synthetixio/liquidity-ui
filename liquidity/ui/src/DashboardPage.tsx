import { Alert, AlertIcon, Collapse, Flex, Heading, Link, Text } from '@chakra-ui/react';
import { MAINNET, OPTIMISM, BASE_ANDROMEDA, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useMigrationData } from './useMigrationData';

export function DashboardPage() {
  const { network } = useNetwork();
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
              We’ve deprecated solo staking and your account was impacted. Please create a
              ticket in discord and the team will help recover your account.
            </Text>
          </Alert>
        </Collapse>

        <Collapse
          in={
            !migrationData?.address && (network?.id === MAINNET.id || network?.id === OPTIMISM.id || BASE_ANDROMEDA.id})
          }
          animateOpacity
          unmountOnExit
        >
          <Alert status="warning" mb="6">
            <AlertIcon />
            <Text>
              Legacy positions on Ethereum, Optimism and Base have been refunded or{' '}
              <Link isExternal href="https://420.synthetix.io" color="cyan.500">
                migrated to 420.
              </Link>
            </Text>
          </Alert>
        </Collapse>
        </Flex>
      </Flex>
    </>
  );
}
