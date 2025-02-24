import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import {
  NewPoolMigration,
  NewPoolMigrationV2x,
  NewPoolPosition,
  usePositionCollateral as useNewPoolPositionCollateral,
  useV2xPosition,
} from '@snx-v3/NewPool';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import React from 'react';
import { Helmet } from 'react-helmet';

export function DashboardPage() {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType('SNX');
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { data: newPoolPositionCollateral } = useNewPoolPositionCollateral();
  const { data: v2xPosition } = useV2xPosition();

  return (
    <>
      <Helmet>
        <title>Synthetix Liquidity V3</title>
        <meta name="description" content="Synthetix Liquidity V3" />
      </Helmet>
      <Flex pt={{ base: 2, sm: 10 }} flexDir="column" mb={16}>
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
        </Flex>

        {v2xPosition && v2xPosition.debt.gt(0) ? (
          <Box mt={12}>
            <NewPoolMigrationV2x />
          </Box>
        ) : null}

        {liquidityPosition && liquidityPosition.debt.gt(0) ? (
          <Box mt={12}>
            <NewPoolMigration />
          </Box>
        ) : null}

        {newPoolPositionCollateral && newPoolPositionCollateral.gt(0) ? (
          <Box mt={12}>
            <NewPoolPosition />
          </Box>
        ) : null}
      </Flex>
    </>
  );
}
