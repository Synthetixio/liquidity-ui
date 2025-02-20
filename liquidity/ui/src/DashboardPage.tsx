import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { MigrationBanner } from '@snx-v3/Migration';
import {
  NewPoolPosition,
  NewPoolMigration,
  usePositionCollateral as useNewPoolPositionCollateral,
} from '@snx-v3/NewPool';
import { PoolsList } from '@snx-v3/Pools';
import { PositionsList } from '@snx-v3/Positions';
import { Rewards } from '@snx-v3/Rewards';
import { StatsTotalLocked } from '@snx-v3/StatsTotalLocked';
import { StatsTotalPnl } from '@snx-v3/StatsTotalPnl';
import { StataUSDC, Synths } from '@snx-v3/Synths';
import { MAINNET, SEPOLIA, useNetwork } from '@snx-v3/useBlockchain';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import React from 'react';
import { Helmet } from 'react-helmet';

const isNext = window.localStorage.SNX_NEXT === 'true';

export function DashboardPage() {
  const { network } = useNetwork();

  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType('SNX');
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { data: newPoolPositionCollateral } = useNewPoolPositionCollateral();

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
          <Flex mt={10} gap={4} flex={1}>
            <StatsTotalLocked />
            {network?.id === MAINNET.id ? null : <StatsTotalPnl />}
          </Flex>
        </Flex>

        {network?.id === MAINNET.id &&
        isNext &&
        newPoolPositionCollateral &&
        newPoolPositionCollateral.gt(0) ? (
          <Box mt={12}>
            <NewPoolPosition />
          </Box>
        ) : null}

        {network?.id === MAINNET.id &&
        isNext &&
        liquidityPosition &&
        liquidityPosition.debt.gt(0) ? (
          <Box mt={12}>
            <NewPoolMigration />
          </Box>
        ) : null}

        <Flex mt={12} flexDirection="column" gap={4}>
          <Heading fontSize="1.25rem" fontFamily="heading" lineHeight="1.75rem">
            Positions
          </Heading>
          <PositionsList />
        </Flex>
        {network?.id === MAINNET.id && isNext ? null : (
          <>
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
          </>
        )}

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
