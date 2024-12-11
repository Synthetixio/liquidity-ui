import { importOracleManagerProxy } from '@snx-v3/contracts';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { erc7412Call, getDefaultFromAddress } from '@snx-v3/withERC7412';
import { Wei, wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export async function fetchOraclePrice({
  targetNetwork,
  provider,
  nodeId,
}: {
  targetNetwork: Network;
  provider: ethers.providers.BaseProvider;
  nodeId: string;
}): Promise<{ price: Wei; timestamp: Date }> {
  const OracleManagerProxyContract = await importOracleManagerProxy(
    targetNetwork.id,
    targetNetwork.preset
  );
  const OracleManagerProxy = new ethers.Contract(
    OracleManagerProxyContract.address,
    OracleManagerProxyContract.abi,
    provider
  );

  const processCall = await OracleManagerProxy.populateTransaction.process(nodeId);
  processCall.from = getDefaultFromAddress(targetNetwork?.name || '');
  const calls = [processCall];

  return await erc7412Call(
    targetNetwork,
    provider,
    calls,
    (txs) => {
      const result = OracleManagerProxy.interface.decodeFunctionResult(
        'process',
        Array.isArray(txs) ? txs[0] : txs
      );
      if (result?.node) {
        return {
          price: wei(result.node.price),
          timestamp: new Date(Number(result.node.timestamp.mul(1000).toString())),
        };
      } else {
        return {
          price: wei(result.price),
          timestamp: new Date(Number(result.timestamp.mul(1000).toString())),
        };
      }
    },
    'useOraclePrice'
  );
}

export function useOraclePrice(nodeId?: string, customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const provider = useProviderForChain(targetNetwork);

  return useQuery({
    refetchInterval: 120_000,
    enabled: Boolean(targetNetwork && provider && nodeId),
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'oracle-price', { nodeId }],
    queryFn: async () => {
      if (!(targetNetwork && provider && nodeId)) {
        throw new Error('OMG');
      }
      return fetchOraclePrice({
        targetNetwork,
        provider,
        nodeId,
      });
    },
  });
}
