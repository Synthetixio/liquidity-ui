import { POOL_ID } from '@snx-v3/constants';
import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { erc7412Call } from '@snx-v3/withERC7412';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function usePositionDebt({
  tokenAddress,
  accountId,
}: {
  tokenAddress?: string;
  accountId?: string;
}) {
  const { data: CoreProxy } = useCoreProxy();
  const { network } = useNetwork();
  const provider = useProviderForChain(network);
  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'PositionDebt',
      { accountId },
      { token: tokenAddress },
      { contractsHash: contractsHash([CoreProxy]) },
    ],
    enabled: Boolean(network && provider && CoreProxy && accountId && tokenAddress),
    queryFn: async () => {
      if (!(network && provider && CoreProxy && accountId && tokenAddress)) {
        throw Error('OMFG');
      }
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const calls = await Promise.all([
        CoreProxyContract.populateTransaction.getPositionDebt(accountId, POOL_ID, tokenAddress),
      ]);

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
