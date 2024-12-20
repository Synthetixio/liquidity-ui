import { contractsHash } from '@snx-v3/tsHelpers';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { erc7412Call } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useAccountCollateral');

export const useAccountCollateral = ({
  accountId,
  tokenAddress,
  network: networkOverride,
}: {
  accountId?: string;
  tokenAddress?: string;
  network?: Network;
}) => {
  const { network: currentNetwork } = useNetwork();
  const network = networkOverride || currentNetwork;
  const { data: CoreProxy } = useCoreProxy(network);
  const provider = useProviderForChain(network);

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'AccountCollateral',
      { accountId },
      { tokenAddress },
      { contractsHash: contractsHash([CoreProxy]) },
    ],
    enabled: Boolean(
      network && provider && CoreProxy && accountId && tokenAddress && network.id === 1
    ),
    queryFn: async (): Promise<{
      totalDeposited: Wei;
      totalAssigned: Wei;
      totalLocked: Wei;
    }> => {
      if (!(network && provider && CoreProxy && accountId && tokenAddress)) {
        throw new Error('OMFG');
      }
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const getAccountCollateralCallPromised =
        CoreProxyContract.populateTransaction.getAccountCollateral(accountId, tokenAddress);
      const calls = await Promise.all([getAccountCollateralCallPromised]);

      return await erc7412Call(
        network,
        provider,
        calls,
        (encoded) => {
          if (!Array.isArray(encoded) || calls.length !== encoded.length) {
            throw new Error('[useAccountCollateral] Unexpected multicall response');
          }

          const [totalDeposited, totalAssigned, totalLocked] =
            CoreProxyContract.interface.decodeFunctionResult('getAccountCollateral', encoded[0]);

          log({ totalDeposited, totalAssigned, totalLocked });
          return {
            totalDeposited: wei(totalDeposited),
            totalAssigned: wei(totalAssigned),
            totalLocked: wei(totalLocked),
          };
        },
        'useAccountCollateral'
      );
    },
  });
};
