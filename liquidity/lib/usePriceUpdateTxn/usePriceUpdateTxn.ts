import { importMulticall3, importPythERC7412Wrapper } from '@snx-v3/contracts';
import { Network, useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useErrorParser } from '@snx-v3/useErrorParser';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { fetchPriceUpdateTxn } from './fetchPriceUpdateTxn';

export function usePriceUpdateTxn(customNetwork?: Network, priceIds?: string[]) {
  const { network: walletNetwork } = useNetwork();
  const network = customNetwork ? customNetwork : walletNetwork;
  const walletProvider = useProvider();
  const errorParser = useErrorParser();

  return useQuery({
    enabled: Boolean(network && priceIds),
    queryKey: [network?.id, 'PriceUpdateTxn', { priceIds: priceIds?.map((p) => p.slice(0, 8)) }],
    queryFn: async (): Promise<{
      target: string;
      callData: string;
      value: number;
      requireSuccess: boolean;
    }> => {
      if (!(network && priceIds)) {
        throw 'OMFG';
      }
      const provider = customNetwork
        ? new ethers.providers.JsonRpcProvider(customNetwork.rpcUrl())
        : walletProvider;

      if (!provider) {
        throw 'OMFG';
      }

      const MulticallContract = await importMulticall3(network.id, network.preset);
      const PythERC7412WrapperContract = await importPythERC7412Wrapper(network.id, network.preset);

      return await fetchPriceUpdateTxn({
        provider,
        MulticallContract,
        PythERC7412WrapperContract,
        priceIds,
      });
    },
    throwOnError: (error) => {
      // TODO: show toast
      errorParser(error);
      return false;
    },

    // considering real staleness tolerance at 3_600s,
    // refetching price updates every 10m should be way more than enough
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
