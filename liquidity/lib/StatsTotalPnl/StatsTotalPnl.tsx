import { Text } from '@chakra-ui/react';
import { PnlAmount } from '@snx-v3/DebtAmount';
import { StatsBox } from '@snx-v3/StatsBox';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useClaimedRewards } from '@snx-v3/useClaimedRewards';
import { useCollateralPrices } from '@snx-v3/useCollateralPrices';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { useRewards } from '@snx-v3/useRewards';
import { wei } from '@synthetixio/wei';
import React from 'react';

export function StatsTotalPnl() {
  const [params] = useParams();
  const { network } = useNetwork();

  const { data: rewards, isPending: isPendingRewards } = useRewards({
    accountId: params.accountId,
  });

  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');

  const { data: claimedRewards, isPending: isPendingClaimedRewards } = useClaimedRewards(
    params.accountId
  );

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

  const totalClaimedRewards = React.useMemo(() => {
    if (typeof claimedRewards === 'number' && !Number.isNaN(claimedRewards)) {
      return wei(claimedRewards);
    }
    return wei(0);
  }, [claimedRewards]);

  return (
    <StatsBox
      title="Total PNL"
      isLoading={
        !(
          !params.accountId ||
          (params.accountId &&
            !isPendingLiquidityPositions &&
            !isPendingRewards &&
            !isPendingSnxPrice &&
            !isPendingRewardsPrices &&
            !isPendingClaimedRewards)
        )
      }
      value={
        totalDebt && totalRewardsValue && totalClaimedRewards ? (
          <PnlAmount debt={totalDebt.sub(totalRewardsValue).sub(totalClaimedRewards)} />
        ) : undefined
      }
      label={
        <Text textAlign="left">
          Aggregated PNL of all of your open positions, unclaimed rewards, and previously claimed
          rewards
        </Text>
      }
    />
  );
}
