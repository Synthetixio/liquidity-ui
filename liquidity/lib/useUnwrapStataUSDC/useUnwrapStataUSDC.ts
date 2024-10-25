import { useDefaultProvider, useSigner, useWallet } from '@snx-v3/useBlockchain';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { ZEROWEI } from '@snx-v3/constants';
import { wei } from '@synthetixio/wei';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { parseTxError } from '@snx-v3/parser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { BigNumber } from 'ethers';

export function useUnwrapStataUSDC() {
  const signer = useSigner();
  const { data: stataUSDC } = useStaticAaveUSDC();
  const { gasSpeed } = useGasSpeed();
  const provider = useDefaultProvider();
  const queryClient = useQueryClient();
  const { activeWallet } = useWallet();

  return useMutation({
    mutationFn: async (amount: BigNumber) => {
      try {
        if (!stataUSDC || !signer || amount.lte(0)) {
          return;
        }

        const gasPrices = await getGasPrice({ provider: signer!.provider });

        const transaction = await stataUSDC.populateTransaction.withdraw(
          amount.toString(),
          activeWallet?.address,
          activeWallet?.address
        );

        const gasLimit = await provider?.estimateGas(transaction);

        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit: wei(gasLimit || ZEROWEI).toBN(),
          gasPrices,
          gasSpeed,
        });

        const txn = await signer.sendTransaction({ ...transaction, ...gasOptionsForTransaction });

        return await txn.wait();
      } catch (error) {
        const parsedError = parseTxError(error);
        const errorResult = stataUSDC?.interface.parseError(parsedError as string);
        console.error('error:', errorResult);

        throw error;
      }
    },
    mutationKey: ['unwrapStataUSDC'],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: false, queryKey: ['TokenBalance'] });
      await queryClient.refetchQueries({ exact: false, queryKey: ['TokenBalance'] });
    },
  });
}
