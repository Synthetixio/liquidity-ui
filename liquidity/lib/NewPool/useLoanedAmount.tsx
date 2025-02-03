import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useTreasuryMarketProxy } from '@snx-v3/useTreasuryMarketProxy';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useLoanedAmount');

export function useLoanedAmount() {
  const [params] = useParams<PositionPageSchemaType>();

  const provider = useProvider();
  const { network } = useNetwork();

  const { data: TreasuryMarketProxy } = useTreasuryMarketProxy();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'New Pool',
      'useLoanedAmount',
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
      const loanedAmount = await TreasuryMarketProxyContract.loanedAmount(params.accountId);
      log('loanedAmount', loanedAmount);

      return loanedAmount;
    },
  });
}
