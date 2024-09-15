import { useDefaultProvider, useNetwork, useSigner } from '@snx-v3/useBlockchain';
import { useCallback, useState } from 'react';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { ZEROWEI } from '@snx-v3/constants';
import  { wei } from '@synthetixio/wei';
import { BigNumberish } from 'ethers';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { parseTxError } from '@snx-v3/parser';
import { useQueryClient } from '@tanstack/react-query';
import { useStataUSDC } from '@snx-v3/useStataUSDC';
import { ZodBigNumber } from '@snx-v3/zod';

const BalanceSchema = ZodBigNumber.transform((x) => wei(x));

export function useConvertStataUSDC({ amount, depositToAave }: { amount: BigNumberish, depositToAave: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const signer = useSigner();
  const { data: stataUSDC } = useStataUSDC();
  const { gasSpeed } = useGasSpeed();
  const provider = useDefaultProvider();
  const queryClient = useQueryClient();
  const { network } = useNetwork();

  const convert = useCallback(async () => {
    try {
      if (!stataUSDC || !signer) {
        return;
      }
      setIsLoading(true);
      setIsSuccess(false);
      const gasPrices = await getGasPrice({ provider: signer!.provider });

      const transaction = await stataUSDC.populateTransaction.deposit(
        amount.toString(),
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

      await txn.wait();


      setIsLoading(false);
      setIsSuccess(true);

      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
      });
    } catch (error) {
      const parsedError = parseTxError(error);
      const errorResult = stataUSDC?.interface.parseError(parsedError as string);
      console.error('error:', errorResult);
      setIsLoading(false);
      throw error;
    }
  }, [amount, depositToAave, gasSpeed, stataUSDC, network?.id, network?.preset, provider, queryClient, signer]);


  async function balance() {
    const balance = stataUSDC?.balanceOf(await signer?.getAddress());
    return BalanceSchema.parse(balance);
  }

  return {
    convert,
    balance,
    isLoading,
    isSuccess,
  };
}
