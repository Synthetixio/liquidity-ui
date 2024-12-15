import { contractsHash } from '@snx-v3/tsHelpers';
import { useAllErrors } from '@snx-v3/useAllErrors';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { CollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useRewardsDistributors } from '@snx-v3/useRewardsDistributors';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useRewards');

export function useRewards({
  accountId,
  poolId,
  collateralType,
}: {
  accountId?: string;
  poolId?: string;
  collateralType?: CollateralType;
}) {
  const collateralAddress = collateralType?.tokenAddress;
  const { network } = useNetwork();
  const provider = useProvider();
  const { data: synthTokens } = useSynthTokens();

  const { data: Multicall3 } = useMulticall3(network);
  const { data: CoreProxy } = useCoreProxy(network);
  const { data: AllErrors } = useAllErrors(network);
  const { data: rewardsDistributors } = useRewardsDistributors(network);

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
          ...(rewardsDistributors ?? []),
          ...(synthTokens ?? []),
        ]),
      },
    ],
    queryFn: async () => {
      if (
        !(
          CoreProxy &&
          Multicall3 &&
          AllErrors &&
          rewardsDistributors &&
          poolId &&
          collateralAddress &&
          accountId &&
          synthTokens
        )
      ) {
        throw new Error('OMG');
      }
      const poolDistributors =
        rewardsDistributors && collateralType
          ? rewardsDistributors.filter(
              (distributor) => distributor.isRegistered && !distributor.collateralType
            )
          : [];
      log('poolDistributors', poolDistributors);

      // We need to filter the distributors, so we only query for this particular collateral type
      const vaultDistributors =
        rewardsDistributors && collateralType
          ? rewardsDistributors.filter(
              (distributor) =>
                distributor.isRegistered &&
                distributor.collateralType &&
                distributor.collateralType.address.toLowerCase() ===
                  collateralType.address.toLowerCase()
            )
          : [];
      log('vaultDistributors', vaultDistributors);

      if (poolDistributors.length === 0 && vaultDistributors.length === 0) {
        return [];
      }

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const getAvailableRewardsArgs = [...vaultDistributors, ...poolDistributors].map(
        (distributor) => ({
          method: 'getAvailableRewards',
          args: [
            ethers.BigNumber.from(accountId),
            ethers.BigNumber.from(poolId),
            collateralAddress,
            distributor.address,
          ],
          distributor,
          isPoolDistributor: false,
        })
      );
      const getAvailablePoolRewardsArgs = poolDistributors.map((distributor) => ({
        method: 'getAvailablePoolRewards',
        args: [
          ethers.BigNumber.from(accountId),
          ethers.BigNumber.from(poolId),
          collateralAddress,
          distributor.address,
        ],
        distributor,
        isPoolDistributor: true,
      }));
      const multicall = [...getAvailableRewardsArgs, ...getAvailablePoolRewardsArgs];
      log('multicall', multicall);

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

      const AllErrorsInterface = new ethers.utils.Interface(AllErrors.abi);
      const availableRewards = multicall
        .map(({ method, distributor, isPoolDistributor }, i) => {
          const { success, returnData } = multicallResponse[i];
          if (!success) {
            log(
              `${method} call error for ${distributor.name}`,
              AllErrorsInterface.parseError(returnData)
            );
            return;
          }
          const [amount] = CoreProxyContract.interface.decodeFunctionResult(method, returnData);
          return {
            distributor,
            claimableAmount: wei(amount),
            isPoolDistributor,
          };
        })
        .filter((info) => info !== undefined);
      log('availableRewards', availableRewards);
      return availableRewards;
    },
  });
}
