import { Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { StatsBox } from '@snx-v3/StatsBox';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { usePositionCollateral as useNewPoolPositionCollateral } from '@snx-v3/NewPool';
export function StatsTotalLocked() {
  const [params] = useParams();

  const { data: liquidityPositions, isPending: isPendingLiquidityPositions } =
    useLiquidityPositions({
      accountId: params.accountId,
    });

  const { data: newPoolPositionCollateral } = useNewPoolPositionCollateral();

  const totalLocked = React.useMemo(
    () =>
      liquidityPositions
        ? liquidityPositions.reduce(
            (result, liquidityPosition) =>
              result.add(liquidityPosition.collateralAmount.mul(liquidityPosition.collateralPrice)),
            wei(0)
          )
        : wei(0),
    [liquidityPositions]
  );

  return (
    <StatsBox
      title="My TVL"
      isLoading={!(!params.accountId || (params.accountId && !isPendingLiquidityPositions))}
      value={
        <Amount prefix="$" value={wei(totalLocked || '0').add(newPoolPositionCollateral ?? 0)} />
      }
      label={
        <>
          <Text textAlign="left">All assets locked in Positions </Text>
        </>
      }
    />
  );
}
