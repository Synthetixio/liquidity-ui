import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useTreasuryMarketProxy } from '@snx-v3/useTreasuryMarketProxy';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useTargetCRatio');

export function useTargetCRatio() {
  const provider = useProvider();
  const { network } = useNetwork();

  const { data: TreasuryMarketProxy } = useTreasuryMarketProxy();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'New Pool',
      'targetCRatio',
      { contractsHash: contractsHash([TreasuryMarketProxy]) },
    ],
    enabled: Boolean(network && provider && TreasuryMarketProxy),
    queryFn: async () => {
      if (!(network && provider && TreasuryMarketProxy)) {
        throw new Error('OMFG');
      }
      const TreasuryMarketProxyContract = new ethers.Contract(
        TreasuryMarketProxy.address,
        TreasuryMarketProxy.abi,
        provider
      );
      const targetCratio = await TreasuryMarketProxyContract.targetCratio();
      log('targetCratio', targetCratio);

      return targetCratio;
    },
  });
}
