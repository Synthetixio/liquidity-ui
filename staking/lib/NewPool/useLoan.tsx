import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useTreasuryMarketProxy } from '@snx-v3/useTreasuryMarketProxy';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useLoan');

export function useLoan() {
  const [params] = useParams<PositionPageSchemaType>();

  const provider = useProvider();
  const { network } = useNetwork();

  const { data: TreasuryMarketProxy } = useTreasuryMarketProxy();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'New Pool',
      'useLoan',
      { accountId: params.accountId },
      { contractsHash: contractsHash([TreasuryMarketProxy]) },
    ],
    enabled: Boolean(network && provider && TreasuryMarketProxy && params.accountId),
    queryFn: async () => {
      if (!(network && provider && TreasuryMarketProxy && params.accountId)) {
        throw new Error('OMFG');
      }
      log('accountId', params.accountId);
      const TreasuryMarketProxyContract = new ethers.Contract(
        TreasuryMarketProxy.address,
        TreasuryMarketProxy.abi,
        provider
      );
      const loan: {
        startTime: ethers.BigNumber;
        duration: ethers.BigNumber;
        power: ethers.BigNumber;
        loanAmount: ethers.BigNumber;
      } = await TreasuryMarketProxyContract.loans(params.accountId);
      log('loan', loan);

      return loan;
    },
  });
}
