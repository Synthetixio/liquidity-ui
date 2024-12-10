import { getSubgraphUrl, ZEROWEI } from '@snx-v3/constants';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useRewardsDistributors } from '@snx-v3/useRewardsDistributors';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { Wei, wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { contractsHash } from '@snx-v3/tsHelpers';
import { ethers } from 'ethers';

const RewardsResponseSchema = z.array(
  z.object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
    payoutTokenAddress: z.string(),
    displaySymbol: z.string().optional(),
    distributorAddress: z.string(),
    decimals: z.number(),
    claimableAmount: z.instanceof(Wei),
    lifetimeClaimed: z.number(),
    isPoolReward: z.boolean(),
  })
);

export type RewardsResponseType = z.infer<typeof RewardsResponseSchema>;

const RewardsDataDocument = `
  query RewardsData($accountId: String!, $distributor: String!) {
    rewardsClaimeds(where: { distributor: $distributor, account: $accountId }) {
      id
      amount
    }
  }
`;

const RewardsDistributionsDocument = `
  query RewardsDistributions($distributor: String!) {
    rewardsDistributions(where: { distributor: $distributor}) {
      collateral_type
      amount
      duration
      start
      created_at
    }
  }
`;

export function useRewards({
  poolId,
  collateralSymbol,
  accountId,
}: {
  poolId?: string;
  collateralSymbol?: string;
  accountId?: string;
}) {
  const { data: collateralType } = useCollateralType(collateralSymbol);
  const collateralAddress = collateralType?.tokenAddress;
  const { network } = useNetwork();
  const provider = useProvider();
  const { data: synthTokens } = useSynthTokens();

  const { data: Multicall3 } = useMulticall3(network);
  const { data: CoreProxy } = useCoreProxy(network);
  const { data: rewardsDistributors } = useRewardsDistributors(network);

  // We need to filter the distributors, so we only query for this particular collateral type
  // Also include all pool level distributors
  const filteredDistributors =
    rewardsDistributors && collateralAddress
      ? rewardsDistributors
          .filter((distributor) => distributor.isRegistered)
          .filter(
            (distributor) =>
              !distributor.collateralType ||
              (distributor.collateralType &&
                distributor.collateralType.address.toLowerCase() ===
                  collateralAddress.toLowerCase())
          )
      : [];

  return useQuery({
    enabled: Boolean(
      network &&
        CoreProxy &&
        Multicall3 &&
        rewardsDistributors &&
        poolId &&
        collateralAddress &&
        accountId &&
        synthTokens
    ),
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'Rewards',
      { accountId },
      { collateralAddress },
      {
        contractsHash: contractsHash([
          CoreProxy,
          Multicall3,
          ...filteredDistributors,
          ...(synthTokens ?? []),
        ]),
      },
    ],
    queryFn: async () => {
      if (
        !(
          network &&
          CoreProxy &&
          Multicall3 &&
          filteredDistributors &&
          poolId &&
          collateralAddress &&
          accountId
        )
      ) {
        throw new Error('OMG');
      }

      if (filteredDistributors.length === 0) return [];

      try {
        const returnData = await Promise.all([
          // Historical data for account id / distributor address pair
          ...filteredDistributors.map((distributor) =>
            fetch(getSubgraphUrl(network?.name), {
              method: 'POST',
              body: JSON.stringify({
                query: RewardsDataDocument,
                variables: { accountId, distributor: distributor.address.toLowerCase() },
              }),
            }).then((res) => res.json())
          ),
          // Metadata for each distributor
          ...filteredDistributors.map((distributor) =>
            fetch(getSubgraphUrl(network?.name), {
              method: 'POST',
              body: JSON.stringify({
                query: RewardsDistributionsDocument,
                variables: { distributor: distributor.address.toLowerCase() },
              }),
            }).then((res) => res.json())
          ),
        ]);

        const historicalData = returnData.slice(0, filteredDistributors.length);
        const metaData = returnData.slice(filteredDistributors.length);

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

        // Get claimable amount for each distributor
        const rewardsCalls = filteredDistributors.map(({ address }: { address: string }) =>
          CoreProxyContract.populateTransaction.getAvailableRewards(
            ethers.BigNumber.from(accountId),
            ethers.BigNumber.from(poolId),
            collateralAddress.toLowerCase(),
            address.toLowerCase()
          )
        );
        const poolRewardsCalls = filteredDistributors.map(({ address }: { address: string }) =>
          CoreProxyContract.populateTransaction.getAvailablePoolRewards(
            ethers.BigNumber.from(accountId),
            ethers.BigNumber.from(poolId),
            collateralAddress.toLowerCase(),
            address.toLowerCase()
          )
        );

        const txs = await Promise.all([...rewardsCalls, ...poolRewardsCalls]);

        const multicallData = txs.map((tx) => ({
          target: CoreProxy.address,
          callData: tx.data,
          allowFailure: true,
        }));

        const Multicall3Contract = new ethers.Contract(
          Multicall3.address,
          Multicall3.abi,
          provider
        );
        const data = await Multicall3Contract.callStatic.aggregate3(multicallData);

        const rewardsResult = data.slice(0, rewardsCalls.length);
        const poolRewardsResult = data.slice(rewardsCalls.length);

        const rewardAmounts: Wei[] = rewardsResult.map((result: any) => {
          if (!result.success) {
            return ZEROWEI;
          }
          const amount = CoreProxyContract.interface.decodeFunctionResult(
            'getAvailableRewards',
            result.returnData
          )[0];
          return wei(amount);
        });

        const poolRewardAmounts: Wei[] = poolRewardsResult.map((result: any) => {
          if (!result.success) {
            return ZEROWEI;
          }
          const amount = CoreProxyContract.interface.decodeFunctionResult(
            'getAvailablePoolRewards',
            result.returnData
          )[0];
          return wei(amount);
        });

        const results: RewardsResponseType = filteredDistributors.map((item: any, i: number) => {
          // Amount claimable for this distributor
          const claimableAmount = rewardAmounts[i].add(poolRewardAmounts[i]);
          const historicalClaims = historicalData[i]?.data?.rewardsClaimeds;
          const distributions = metaData[i]?.data?.rewardsDistributions;
          const symbol = item.payoutToken.symbol;
          const synthToken = synthTokens?.find(
            (synth) => synth.address.toUpperCase() === item.payoutToken.address?.toUpperCase()
          );
          const displaySymbol = synthToken ? synthToken?.symbol.slice(1) : symbol;

          if (!distributions || !distributions.length) {
            return {
              address: item.address,
              name: item.name,
              symbol,
              displaySymbol,
              distributorAddress: item.address,
              decimals: item.payoutToken.decimals,
              payoutTokenAddress: item.payoutToken.address,
              claimableAmount: wei(0),
              isPoolReward: false,
              lifetimeClaimed: historicalClaims
                ? historicalClaims
                    .reduce(
                      (acc: Wei, item: { amount: string }) => acc.add(wei(item.amount, 18, true)),
                      wei(0)
                    )
                    .toNumber()
                : 0,
            };
          }

          return {
            address: item.address,
            name: item.name,
            symbol,
            displaySymbol,
            distributorAddress: item.address,
            decimals: item.payoutToken.decimals,
            payoutTokenAddress: item.payoutToken.address,
            claimableAmount,
            isPoolReward: poolRewardAmounts[i].gt(0),
            lifetimeClaimed: historicalClaims
              .reduce(
                (acc: Wei, item: { amount: string }) => acc.add(wei(item.amount, 18, true)),
                wei(0)
              )
              .toNumber(),
          };
        });

        const sortedBalances = results.sort(
          (a, b) => b.claimableAmount.toNumber() - a.claimableAmount.toNumber()
        );

        return RewardsResponseSchema.parse(sortedBalances);
      } catch (error) {
        console.error(error);
        return [];
      }
    },
  });
}
