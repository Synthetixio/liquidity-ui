import { Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { DebtAmount, PnlAmount } from '@snx-v3/DebtAmount';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { StatBox } from './StatBox';

export const StatsList = () => {
  const [params] = useParams();
  const { network } = useNetwork();

  const { data: liquidityPositions, isPending } = useLiquidityPositions({
    accountId: params.accountId,
  });

  const totalDebt = React.useMemo(
    () =>
      liquidityPositions
        ? liquidityPositions.reduce(
            (result, liquidityPosition) => result.add(liquidityPosition.debt),
            wei(0)
          )
        : wei(0),
    [liquidityPositions]
  );

  const totalAssets = React.useMemo(
    () =>
      liquidityPositions
        ? liquidityPositions.reduce(
            (result, liquidityPosition) =>
              result.add(
                liquidityPosition.availableCollateral.mul(liquidityPosition.collateralPrice)
              ),
            wei(0)
          )
        : wei(0),
    [liquidityPositions]
  );

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
    <Flex flexWrap="wrap" w="100%" gap="4">
      <StatBox
        title="Available to Lock"
        isLoading={Boolean(params.accountId && isPending)}
        value={<Amount prefix="$" value={wei(totalAssets || '0')} />}
        label={
          <>
            <Text textAlign="left">
              Total assets that can be Locked, including:
              <br /> - Unlocked assets not yet withdrawn
              <br /> - Available assets in your wallet
            </Text>
          </>
        }
      />

      <StatBox
        title="Total Locked"
        isLoading={Boolean(params.accountId && isPending)}
        value={<Amount prefix="$" value={wei(totalLocked || '0')} />}
        label={
          <>
            <Text textAlign="left">All assets locked in Positions </Text>
          </>
        }
      />

      {network?.preset === 'andromeda' ? (
        <StatBox
          title="Total PNL"
          isLoading={Boolean(params.accountId && isPending)}
          value={<PnlAmount debt={totalDebt} />}
          label={<Text textAlign="left">Aggregated PNL of all your open Positions</Text>}
        />
      ) : null}

      {network?.preset !== 'andromeda' ? (
        <StatBox
          title="Total Debt"
          isLoading={Boolean(params.accountId && isPending)}
          value={<DebtAmount debt={totalDebt} />}
          label={<Text textAlign="left">Aggregated Debt of all your open Positions</Text>}
        />
      ) : null}
    </Flex>
  );
};
