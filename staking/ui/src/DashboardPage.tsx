import { Flex, Heading, Text } from '@chakra-ui/react';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type HomePageSchemaType, useParams } from '@snx-v3/useParams';
import React from 'react';
import { Helmet } from 'react-helmet';
import { EmptyPosition } from './Staking/EmptyPosition';
import { EmptyV3Debt } from './Staking/EmptyV3Debt';
import { Loading } from './Staking/Loading';
import { MigrateFromV2x } from './Staking/MigrateFromV2x';
import { MigrateFromV3 } from './Staking/MigrateFromV3';
import { PoolStats } from './Staking/PoolStats';
import { StakingPosition } from './Staking/StakingPosition';
import { usePositionCollateral as useNewPoolPositionCollateral } from './Staking/usePositionCollateral';
import { useV2xPosition } from './Staking/useV2xPosition';

export function DashboardPage() {
  const [params] = useParams<HomePageSchemaType>();
  const { data: collateralType, isPending: isPendingCollateralType } = useCollateralType('SNX');
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { data: newPoolPositionCollateral, isPending: isPendingNewPoolPositionCollateral } =
    useNewPoolPositionCollateral();
  const { data: v2xPosition, isPending: isPendingV2xPosition } = useV2xPosition();

  const isPending =
    isPendingCollateralType ||
    (params.accountId && isPendingLiquidityPosition) ||
    isPendingNewPoolPositionCollateral ||
    isPendingV2xPosition;

  const hasV2xPosition = v2xPosition && v2xPosition.debt.gt(0);
  const hasV3Position = liquidityPosition && liquidityPosition.collateralAmount.gt(0);
  const hasV3Debt = liquidityPosition && liquidityPosition.debt.gt(0);
  const hasStakingPosition = newPoolPositionCollateral && newPoolPositionCollateral.gt(0);

  return (
    <>
      <Helmet>
        <title>Synthetix Staking</title>
        <meta name="description" content="Synthetix Staking" />
      </Helmet>
      <Flex pt={{ base: 2, sm: 10 }} direction="column" mb={16} width="100%">
        <Flex direction="column" minWidth={400} gap={3}>
          <Heading
            mt={[6, 10]}
            color="gray.50"
            maxWidth="40rem"
            fontSize={['2rem', '3rem']}
            lineHeight="120%"
          >
            Stake and Earn
          </Heading>

          <Flex justifyContent="space-between" alignItems="center" gap={6} flexWrap="wrap">
            <Text color="gray.500" fontSize="1rem" lineHeight={6} fontFamily="heading">
              Deposit SNX to earn a privileged share of protocol performance
            </Text>

            <PoolStats />
          </Flex>
        </Flex>
        <Flex direction="column" mt={12} gap={6}>
          {params.showAll || isPending ? <Loading /> : null}
          {params.showAll || (!isPending && hasV2xPosition) ? <MigrateFromV2x /> : null}
          {params.showAll || (!isPending && hasV3Position && hasV3Debt) ? <MigrateFromV3 /> : null}
          {params.showAll || (!isPending && hasStakingPosition) ? <StakingPosition /> : null}
          {params.showAll || (!isPending && hasV3Position && !hasV3Debt) ? <EmptyV3Debt /> : null}
          {params.showAll ||
          (!isPending && !hasV2xPosition && !hasV3Position && !hasStakingPosition) ? (
            <EmptyPosition />
          ) : null}
        </Flex>
      </Flex>
    </>
  );
}
