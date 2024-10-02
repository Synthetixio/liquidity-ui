import { Contract } from '@ethersproject/contracts';
import { importWETH } from '@snx-v3/contracts';
import {
  Network,
  useNetwork,
  useProvider,
  useProviderForChain,
  useSigner,
} from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useWETH(customNetwork?: Network) {
  const { network } = useNetwork();
  const provider = useProvider();
  const signer = useSigner();
  const providerForChain = useProviderForChain(customNetwork);
  const signerOrProvider = signer || provider;
  const targetNetwork = customNetwork || network;
  const withSigner = Boolean(signer);
  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'Weth', { withSigner }],
    enabled: Boolean(signerOrProvider && targetNetwork),
    queryFn: async function () {
      if (!(signerOrProvider && targetNetwork)) throw new Error('OMFG');
      if (providerForChain && customNetwork) {
        const { address, abi } = await importWETH(targetNetwork.id, targetNetwork.preset);
        return new Contract(address, abi, providerForChain);
      }
      const { address, abi } = await importWETH(targetNetwork.id, targetNetwork.preset);
      return new Contract(address, abi, signerOrProvider);
    },
    // we may not have this on all chains
    throwOnError: false,
    staleTime: Infinity,
  });
}
