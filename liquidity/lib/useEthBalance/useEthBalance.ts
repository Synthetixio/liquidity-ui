import { useQuery } from '@tanstack/react-query';
import { useWallet, useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { ZodBigNumber } from '@snx-v3/zod';
import { wei } from '@synthetixio/wei';

const BalanceSchema = ZodBigNumber.transform((x) => wei(x));

export function useEthBalance() {
  const { activeWallet } = useWallet();
  const provider = useProvider();
  const { network } = useNetwork();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'EthBalance',
      { accountAddress: activeWallet?.address },
    ],
    enabled: Boolean(provider && activeWallet),
    queryFn: async () => {
      if (!(provider && activeWallet)) throw 'OMFG';
      return BalanceSchema.parse(await provider.getBalance(activeWallet.address));
    },
  });
}
