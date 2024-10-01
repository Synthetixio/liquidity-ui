import { Contract } from '@ethersproject/contracts';
import { importLegacyMarket } from '@snx-v3/contracts';
import {
  Network,
  useNetwork,
  useProvider,
  useProviderForChain,
  useSigner,
} from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';

export function useLegacyMarket(customNetwork?: Network) {
  const { network } = useNetwork();
  const provider = useProvider();
  const signer = useSigner();
  const providerForChain = useProviderForChain(customNetwork);
  const signerOrProvider = signer || provider;
  const targetNetwork = customNetwork || network;
  const withSigner = Boolean(signer);
  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'LegacyMarket', { withSigner }],
    enabled: Boolean(signerOrProvider && targetNetwork),
    queryFn: async function () {
      if (!(signerOrProvider && targetNetwork)) throw new Error('OMFG');
      if (providerForChain && customNetwork) {
        const { address, abi } = await importLegacyMarket(targetNetwork.id, targetNetwork.preset);
        return new Contract(address, abi, providerForChain);
      }
      const { address, abi } = await importLegacyMarket(targetNetwork?.id, targetNetwork?.preset);
      return new Contract(address, abi, signerOrProvider);
    },
    staleTime: Infinity,
  });
}
