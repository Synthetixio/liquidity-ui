import { POOL_ID } from '@snx-v3/constants';
import { contractsHash } from '@snx-v3/tsHelpers';
// import { useAllErrors } from '@snx-v3/useAllErrors';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useRewardsDistributors } from '@snx-v3/useRewardsDistributors';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { Wei, wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { tokenOverrides } from '@snx-v3/constants';

const log = debug('snx:useRewards');

export function groupRewardsBySymbol({
  rewards,
  synthTokens,
}: {
  rewards?: {
    distributor: {
      payoutToken: {
        address: string;
        symbol: string;
      };
    };
    claimableAmount: Wei;
  }[];
  synthTokens?: {
    address: string;
    token?: {
      address: string;
      symbol: string;
    };
  }[];
}):
  | undefined
  | {
      displaySymbol: string;
      claimableAmount: Wei;
    }[] {
  if (rewards && rewards.length > 0) {
    const map = new Map();
    rewards
      .filter(({ claimableAmount }) => claimableAmount.gt(0))
      .forEach(({ distributor, claimableAmount }) => {
        const synthToken = synthTokens?.find(
          (synth) => synth.address.toLowerCase() === distributor.payoutToken.address.toLowerCase()
        );
        const token = synthToken && synthToken.token ? synthToken.token : distributor.payoutToken;
        const displaySymbol = tokenOverrides[token.address] ?? token.symbol;
        if (map.has(displaySymbol)) {
          map.set(displaySymbol, map.get(displaySymbol).add(claimableAmount));
        } else {
          map.set(displaySymbol, claimableAmount);
        }
      });
    return Array.from(map.entries())
      .map(([displaySymbol, claimableAmount]) => ({
        displaySymbol,
        claimableAmount,
      }))
      .sort((a, b) => a.displaySymbol.localeCompare(b.displaySymbol))
      .sort((a, b) => b.claimableAmount.toNumber() - a.claimableAmount.toNumber());
  }
}

export function useRewards({ accountId }: { accountId?: string }) {
  const { network } = useNetwork();
  const provider = useProvider();
  const { data: synthTokens } = useSynthTokens();
  const { data: collateralTypes } = useCollateralTypes();
  const { data: Multicall3 } = useMulticall3(network);
  const { data: CoreProxy } = useCoreProxy(network);
  // const { data: AllErrors } = useAllErrors(network);
  const { data: rewardsDistributors } = useRewardsDistributors(network);

  return useQuery({
    enabled: Boolean(
      network &&
        CoreProxy &&
        Multicall3 &&
        // AllErrors &&
        rewardsDistributors &&
        accountId &&
        collateralTypes &&
        synthTokens
    ),
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'Rewards',
      { accountId },
      {
        contractsHash: contractsHash([
          CoreProxy,
          Multicall3,
          ...(rewardsDistributors ?? []),
          ...(synthTokens ?? []),
          ...(collateralTypes ?? []),
        ]),
      },
    ],
    queryFn: async () => {
      if (
        !(
          CoreProxy &&
          Multicall3 &&
          // AllErrors &&
          rewardsDistributors &&
          accountId &&
          collateralTypes &&
          synthTokens
        )
      ) {
        throw new Error('OMG');
      }

      const vaultDistributors = rewardsDistributors
        .map((distributor) => {
          if (distributor.collateralType) {
            return {
              method: 'getAvailableRewards',
              claimMethod: 'claimRewards',
              args: [
                ethers.BigNumber.from(accountId),
                ethers.BigNumber.from(POOL_ID),
                distributor.collateralType.address,
                distributor.address,
              ],
              distributor,
              collateralType: distributor.collateralType,
            };
          }
        })
        .filter((item) => item !== undefined);
      log('vaultDistributors', vaultDistributors);

      const poolDistributors = rewardsDistributors
        .filter((distributor) => !distributor.collateralType)
        .flatMap((distributor) => ({
          method: 'getAvailablePoolRewards',
          claimMethod: 'claimPoolRewards',
          args: [
            ethers.BigNumber.from(accountId),
            ethers.BigNumber.from(POOL_ID),
            ethers.constants.AddressZero,
            distributor.address,
          ],
          distributor,
          collateralType: undefined,
        }));
      log('poolDistributors', poolDistributors);

      const liquidationRewardsDistributors = rewardsDistributors
        .filter((distributor) => !distributor.collateralType)
        .filter((distributor) => distributor.name.includes('Liquidation Rewards'))
        .flatMap((distributor) =>
          collateralTypes.map((collateralType) => ({
            method: 'getAvailableRewards',
            claimMethod: 'claimRewards',
            args: [
              ethers.BigNumber.from(accountId),
              ethers.BigNumber.from(POOL_ID),
              collateralType.address,
              distributor.address,
            ],
            distributor,
            collateralType,
          }))
        );
      log('liquidationRewardsDistributors', liquidationRewardsDistributors);

      const multicall = [
        ...vaultDistributors,
        ...poolDistributors,
        ...liquidationRewardsDistributors,
      ];
      log('multicall', multicall);

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
      const calls = await Promise.all(
        multicall.map(async ({ method, args }) => {
          const { to, data } = await CoreProxyContract.populateTransaction[method](...args);
          return {
            target: to,
            callData: data,
            allowFailure: true,
          };
        })
      );
      log('calls', calls);

      const Multicall3Contract = new ethers.Contract(Multicall3.address, Multicall3.abi, provider);
      const multicallResponse = await Multicall3Contract.callStatic.aggregate3(calls);
      log('multicallResponse', multicallResponse);

      // const AllErrorsInterface = new ethers.utils.Interface(AllErrors.abi);
      const availableRewards = multicall
        .map(({ method, claimMethod, args, distributor, collateralType }, i) => {
          const { success, returnData } = multicallResponse[i];
          if (!success) {
            // log(
            //   `${method} call error for ${distributor.name}`,
            //   AllErrorsInterface.parseError(returnData)
            // );
            return;
          }
          const [amount] = CoreProxyContract.interface.decodeFunctionResult(method, returnData);
          return {
            method,
            claimMethod,
            args,
            distributor,
            collateralType,
            claimableAmount: wei(amount),
          };
        })
        .filter((info) => info !== undefined);
      log('availableRewards', availableRewards);
      return availableRewards;
    },
  });
}
