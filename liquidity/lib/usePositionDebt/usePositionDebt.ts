import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { getPriceUpdates, getPythFeedIds } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { erc7412Call } from '@snx-v3/withERC7412';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function usePositionDebt({
  tokenAddress,
  accountId,
  poolId,
}: {
  tokenAddress?: string;
  accountId?: string;
  poolId?: string;
}) {
  const { data: CoreProxy } = useCoreProxy();
  const { network } = useNetwork();
  const provider = useProviderForChain(network);
  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'PositionDebt',
      { accountId },
      {
        pool: poolId,
        token: tokenAddress,
      },
      { contractsHash: contractsHash([CoreProxy]) },
    ],
    enabled: Boolean(network && provider && CoreProxy && accountId && poolId && tokenAddress),
    queryFn: async () => {
      if (!(network && provider && CoreProxy && accountId && poolId && tokenAddress)) {
        throw Error('OMFG');
      }
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const calls = await Promise.all([
        CoreProxyContract.populateTransaction.getPositionDebt(accountId, poolId, tokenAddress),
      ]);

      const priceUpdateTx = (await getPriceUpdates(
        (await getPythFeedIds(network)) as string[],
        network
      ).catch(() => undefined)) as any;

      // if (priceUpdateTx) {
      //   calls.unshift(priceUpdateTx);
      // }

      return await erc7412Call(
        network,
        provider,
        calls,
        ([positionDebtResult]) => {
          const [debt] = CoreProxyContract.interface.decodeFunctionResult(
            'getPositionDebt',
            positionDebtResult
          );
          return wei(debt);
        },
        `usePositionDebt`
      );
    },
  });
}
