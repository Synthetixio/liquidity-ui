import { useDefaultProvider, useSigner } from '@snx-v3/useBlockchain';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { ZEROWEI } from '@snx-v3/constants';
import { wei } from '@synthetixio/wei';
import { BigNumberish } from 'ethers';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { parseTxError } from '@snx-v3/parser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';

export function useConvertStataUSDC({
  amount,
  depositToAave,
}: {
  amount: BigNumberish;
  depositToAave: boolean;
}) {
  const signer = useSigner();
  const { data: stataUSDC } = useStaticAaveUSDC();
  const { gasSpeed } = useGasSpeed();
  const provider = useDefaultProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        if (!stataUSDC || !signer) {
          return;
        }

        const gasPrices = await getGasPrice({ provider: signer!.provider });

        const transaction = await stataUSDC.populateTransaction.deposit(
          amount,
          await signer.getAddress(),
          0,
          depositToAave
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
    mutationKey: ['wrapUSDC'],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: false, queryKey: ['TokenBalance'] });
      await queryClient.refetchQueries({ exact: false, queryKey: ['TokenBalance'] });
    },
  });
}
