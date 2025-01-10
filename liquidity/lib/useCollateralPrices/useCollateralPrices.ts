import { contractsHash } from '@snx-v3/tsHelpers';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { erc7412Call } from '@snx-v3/withERC7412';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useCollateralPrices');

export function useCollateralPrices(collateralAddresses: Set<string>, customNetwork?: Network) {
  const { network: currentNetwork } = useNetwork();
  const network = customNetwork ?? currentNetwork;
  const provider = useProviderForChain(network);

  const { data: CoreProxy } = useCoreProxy(customNetwork);

  return useQuery({
    enabled: Boolean(network && provider && CoreProxy && collateralAddresses),
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'CollateralPrices',
      {
        contractsHash: contractsHash([
          CoreProxy,
          ...Array.from(collateralAddresses).map((address) => ({ address })),
        ]),
      },
    ],
    queryFn: async () => {
      if (!(network && provider && CoreProxy && collateralAddresses)) {
        throw new Error('OMFG');
      }
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const multicall = Array.from(collateralAddresses).map((address) => ({
        method: 'getCollateralPrice',
        args: [address],
        address,
      }));
      log('multicall', multicall);

      const calls = await Promise.all(
        multicall.map(({ method, args }) => CoreProxyContract.populateTransaction[method](...args))
      );
      log('calls', calls);

      const prices = await erc7412Call(
        network,
        provider,
        calls,
        (encoded) => {
          if (!Array.isArray(encoded) || calls.length !== encoded.length) {
            throw new Error('[useCollateralPrices] Unexpected multicall response');
          }
          return multicall.reduce((result, call, i) => {
            const [price] = CoreProxyContract.interface.decodeFunctionResult(
              'getCollateralPrice',
              encoded[i]
            );
            result.set(call.address, price);
            return result;
          }, new Map());
        },
        'useCollateralPrices'
      );
      log('prices', prices);
      return prices;
    },
  });
}
