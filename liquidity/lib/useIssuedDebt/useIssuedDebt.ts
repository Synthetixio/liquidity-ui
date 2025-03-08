import { getIssuedDebtUrl } from '@snx-v3/constants';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';

const log = debug('snx:useIssuedDebt');

export function useIssuedDebt(accountId?: string) {
  const { network } = useNetwork();

  return useQuery({
    queryKey: [`${network?.id}-${network?.preset}`, 'IssuedDebt', { accountId }],
    enabled: Boolean(network && accountId),
    queryFn: async () => {
      const response = await fetch(getIssuedDebtUrl(network?.id) + `?accountId=${accountId}`);
      const issuedDebts: { issuance: string; collateral_type: string }[] = await response.json();
      log('issuedDebt', issuedDebts);
      return issuedDebts;
    },
    staleTime: 60_000,
  });
}
