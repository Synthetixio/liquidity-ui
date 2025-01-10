import { Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { DebtAmount, PnlAmount } from '@snx-v3/DebtAmount';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralPrices } from '@snx-v3/useCollateralPrices';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import { useRewards } from '@snx-v3/useRewards';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { StatBox } from './StatBox';

export const StatsList = () => {
  const [params] = useParams();
  const { network } = useNetwork();

  const { data: rewards, isPending: isPendingRewards } = useRewards({
    accountId: params.accountId,
  });

  const rewardsTokens = React.useMemo(() => {
    const result: Set<string> = new Set();
    if (rewards) {
      for (const reward of rewards) {
        if (reward.collateralType) {
          result.add(reward.collateralType.address);
        }
      }
    }
    return result;
  }, [rewards]);

  const { data: rewardsTokenPrices, isPending: isPendingRewardsPrices } = useCollateralPrices(
    rewardsTokens,
    network
  );

  const totalRewardsValue = React.useMemo(
    () =>
      rewards
        ? rewards.reduce(
            (result, reward) =>
              reward &&
              reward.collateralType &&
              reward.collateralType.address &&
              rewardsTokenPrices &&
              rewardsTokenPrices.has(reward.collateralType.address)
                ? result.add(
                    reward.claimableAmount.mul(
                      rewardsTokenPrices.get(reward.collateralType.address)
                    )
                  )
                : result,
            wei(0)
          )
        : wei(0),
    [rewards, rewardsTokenPrices]
  );

  const { data: liquidityPositions, isPending: isPendingLiquidityPositions } =
    useLiquidityPositions({
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
        isLoading={Boolean(params.accountId && isPendingLiquidityPositions)}
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
        isLoading={Boolean(params.accountId && isPendingLiquidityPositions)}
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
          isLoading={Boolean(
            params.accountId &&
              isPendingLiquidityPositions &&
              isPendingRewards &&
              isPendingRewardsPrices
          )}
          value={<PnlAmount debt={totalDebt.sub(totalRewardsValue)} />}
          label={
            <Text textAlign="left">
              Aggregated PNL of all your open Positions and combined value of all your Rewards
            </Text>
          }
        />
      ) : null}

      {network?.preset !== 'andromeda' ? (
        <StatBox
          title="Total Debt"
          isLoading={Boolean(
            params.accountId &&
              isPendingLiquidityPositions &&
              isPendingRewards &&
              isPendingRewardsPrices
          )}
          value={<DebtAmount debt={totalDebt.sub(totalRewardsValue)} />}
          label={
            <Text textAlign="left">
              Aggregated value of all your Rewards minus your open Positions Debt
            </Text>
          }
        />
      ) : null}
    </Flex>
  );
};
