import { Flex, Heading, Text } from '@chakra-ui/react';
import { useWallet } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type HomePageSchemaType, useParams } from '@snx-v3/useParams';
import React from 'react';
import { Helmet } from 'react-helmet';
import { ConnectYourWallet } from './Staking/ConnectYourWallet';
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

  const { activeWallet } = useWallet();
  const isPending =
    activeWallet &&
    (isPendingCollateralType ||
      (params.accountId && isPendingLiquidityPosition) ||
      (params.accountId && isPendingNewPoolPositionCollateral) ||
      isPendingV2xPosition);

  const hasV2xPosition = v2xPosition && v2xPosition.debt.gt(0);
  const hasV3Position = liquidityPosition && liquidityPosition.collateralAmount.gt(0);
  const hasV3Debt = liquidityPosition && liquidityPosition.debt.gt(0);
  const hasStakingPosition = newPoolPositionCollateral && newPoolPositionCollateral.gt(0);

  let step = 0;
  return (
    <>
      <Helmet>
        <title>Synthetix Staking</title>
        <meta name="description" content="Synthetix Staking" />
      </Helmet>
      <Flex pt={2} direction="column" mb={16} width="100%">
        <Flex direction="column" minWidth={400} gap={3}>
          <Heading color="gray.50" maxWidth="40rem" fontSize={['2rem', '3rem']} lineHeight="120%">
            Stake
          </Heading>

          <Flex justifyContent="space-between" alignItems="center" gap={6} flexWrap="wrap">
            <Text color="gray.500" fontSize="1rem" lineHeight={6} fontFamily="heading">
              Deposit into the 420 Pool to start earning yield
            </Text>

            <PoolStats />
          </Flex>
        </Flex>
        <Flex direction="column" mt={6} gap={6}>
          {params.showAll ? (
            <Heading mt={12} color="red.500">
              State {step++}. Loading
            </Heading>
          ) : null}
          {params.showAll || isPending ? <Loading /> : null}

          {params.showAll ? (
            <Heading mt={12} color="red.500">
              State {step++}. Not connected
            </Heading>
          ) : null}
          {params.showAll || !activeWallet ? <ConnectYourWallet /> : null}

          {params.showAll ? (
            <Heading mt={12} color="red.500">
              State {step++}. Connected wallet, no v2x/v3 positions
            </Heading>
          ) : null}
          {params.showAll ||
          (activeWallet &&
            !isPending &&
            !hasV2xPosition &&
            !hasV3Position &&
            !hasStakingPosition) ? (
            <EmptyPosition />
          ) : null}

          {params.showAll ? (
            <Heading mt={12} color="red.500">
              State {step++}. v3 position without debt
            </Heading>
          ) : null}
          {params.showAll || (activeWallet && !isPending && hasV3Position && !hasV3Debt) ? (
            <EmptyV3Debt />
          ) : null}

          {params.showAll ? (
            <Heading mt={12} color="red.500">
              State {step++}. Migrate v2x position
            </Heading>
          ) : null}
          {params.showAll || (activeWallet && !isPending && hasV2xPosition) ? (
            <MigrateFromV2x />
          ) : null}

          {params.showAll ? (
            <Heading mt={12} color="red.500">
              State {step++}. Migrate v3 position
            </Heading>
          ) : null}
          {params.showAll || (activeWallet && !isPending && hasV3Position && hasV3Debt) ? (
            <MigrateFromV3 />
          ) : null}

          {params.showAll ? (
            <Heading mt={12} color="red.500">
              State {step++}. Pool 420 existing position
            </Heading>
          ) : null}
          {params.showAll || (activeWallet && !isPending && hasStakingPosition) ? (
            <StakingPosition />
          ) : null}
        </Flex>
      </Flex>
    </>
  );
}
