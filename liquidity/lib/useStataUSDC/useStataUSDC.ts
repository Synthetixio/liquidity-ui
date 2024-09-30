import { Contract } from '@ethersproject/contracts';
import { useQuery } from '@tanstack/react-query';
import {
  Network,
  useNetwork,
  useProvider,
  useProviderForChain,
  useSigner,
} from '@snx-v3/useBlockchain';
import { importStataUSDC } from '@snx-v3/contracts';

export function useStataUSDC(customNetwork?: Network) {
  const providerForChain = useProviderForChain(customNetwork);
  const { network } = useNetwork();
  const provider = useProvider();
  const signer = useSigner();
  const targetNetwork = customNetwork || network;

  const withSigner = Boolean(signer);

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'stataUSDC', { withSigner }],
    queryFn: async function () {
      if (providerForChain && customNetwork) {
        const { address: lmAddress, abi: lmAbi } = await importStataUSDC(
          customNetwork.id,
          customNetwork.preset
        );
        return new Contract(lmAddress, lmAbi, providerForChain);
      }
      const signerOrProvider = signer || provider;
      if (!signerOrProvider || !network) throw new Error('Should be disabled CP');

      const { address: lmAddress, abi: lmAbi } = await importStataUSDC(
        network?.id,
        network?.preset
      );

      return new Contract(lmAddress, lmAbi, signerOrProvider);
    },
    enabled: Boolean(provider || providerForChain),
    staleTime: Infinity,
  });
}
