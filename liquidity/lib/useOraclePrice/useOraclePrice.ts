import { importOracleManagerProxy } from '@snx-v3/contracts';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { erc7412Call, getDefaultFromAddress } from '@snx-v3/withERC7412';
import { Wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { Contract } from 'ethers';

export function useOraclePrice(nodeId?: string, customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const provider = useProviderForChain(targetNetwork);

  return useQuery({
    refetchInterval: 15000,
    retry: false,
    staleTime: 99999,
    enabled: Boolean(targetNetwork && provider && nodeId),
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'oracle-price', { nodeId }],
    queryFn: async () => {
      if (!(targetNetwork && provider && nodeId)) {
        throw new Error('OMG');
      }
      const OracleManagerProxyContract = await importOracleManagerProxy(
        targetNetwork.id,
        targetNetwork.preset
      );
      const OracleManagerProxy = new Contract(
        OracleManagerProxyContract.address,
        OracleManagerProxyContract.abi,
        provider
      );

      const price = [await OracleManagerProxy.populateTransaction.process(nodeId)];

      price[0].from = getDefaultFromAddress(targetNetwork?.name || '');

      return await erc7412Call(
        targetNetwork,
        provider,
        price,
        (txs) => {
          const result = OracleManagerProxy.interface.decodeFunctionResult(
            'process',
            Array.isArray(txs) ? txs[0] : txs
          );
          if (result?.node) {
            return {
              price: new Wei(result.node.price),
              timestamp: new Date(Number(result.node.timestamp.mul(1000).toString())),
            };
          } else {
            return {
              price: new Wei(result.price),
              timestamp: new Date(Number(result.timestamp.mul(1000).toString())),
            };
          }
        },
        'useOraclePrice'
      );
    },
  });
}
