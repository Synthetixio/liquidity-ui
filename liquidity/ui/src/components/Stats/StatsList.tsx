import { Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { PnlAmount } from '@snx-v3/DebtAmount';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralPrices } from '@snx-v3/useCollateralPrices';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import { usePythPrice } from '@snx-v3/usePythPrice';
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

  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');

  const rewardsTokens = React.useMemo(() => {
    const result: Set<string> = new Set();
    if (rewards) {
      for (const reward of rewards) {
        if (reward.claimableAmount.gt(0)) {
          result.add(reward.distributor.payoutToken.address);
        }
      }
    }
    return result;
  }, [rewards]);

  const { data: rewardsTokenPrices, isPending: isPendingRewardsPrices } = useCollateralPrices(
    rewardsTokens,
    network
  );

  const totalRewardsValue = React.useMemo(() => {
    if (rewards && rewardsTokenPrices && snxPrice) {
      return rewards.reduce((result, reward) => {
        // all rewards should have price except SNX as it is not a collateral on Base
        if (reward.distributor.payoutToken.symbol === 'SNX') {
          return result.add(reward.claimableAmount.mul(snxPrice));
        }
        if (rewardsTokenPrices.has(reward.distributor.payoutToken.address)) {
          return result.add(
            reward.claimableAmount.mul(
              rewardsTokenPrices.get(reward.distributor.payoutToken.address)
            )
          );
        }
        return result;
      }, wei(0));
    }
  }, [rewards, rewardsTokenPrices, snxPrice]);

  const { data: liquidityPositions, isPending: isPendingLiquidityPositions } =
    useLiquidityPositions({
      accountId: params.accountId,
    });

  const totalDebt = React.useMemo(() => {
    if (liquidityPositions) {
      return liquidityPositions.reduce(
        (result, liquidityPosition) => result.add(liquidityPosition.debt),
        wei(0)
      );
    }
  }, [liquidityPositions]);

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
        isLoading={!(params.accountId && !isPendingLiquidityPositions)}
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
        isLoading={!(params.accountId && !isPendingLiquidityPositions)}
        value={<Amount prefix="$" value={wei(totalLocked || '0')} />}
        label={
          <>
            <Text textAlign="left">All assets locked in Positions </Text>
          </>
        }
      />

      <StatBox
        title="Total PNL"
        isLoading={
          !(
            params.accountId &&
            !isPendingLiquidityPositions &&
            !isPendingRewards &&
            !isPendingSnxPrice &&
            !isPendingRewardsPrices
          )
        }
        value={
          totalDebt && totalRewardsValue ? (
            <PnlAmount debt={totalDebt.sub(totalRewardsValue)} />
          ) : null
        }
        label={
          <Text textAlign="left">
            Aggregated PNL of all your open Positions and combined value of all your Rewards
          </Text>
        }
      />
    </Flex>
  );
};
