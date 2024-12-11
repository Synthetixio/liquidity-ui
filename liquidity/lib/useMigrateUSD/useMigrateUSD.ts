import { useDefaultProvider, useNetwork, useSigner } from '@snx-v3/useBlockchain';
import { useLegacyMarket } from '@snx-v3/useLegacyMarket';
import { useCallback, useState } from 'react';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { ZEROWEI } from '@snx-v3/constants';
import Wei, { wei } from '@synthetixio/wei';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { extractErrorData } from '@snx-v3/parseContractError';
import { useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { txWait } from '@snx-v3/txWait';

export function useMigrateUSD({ amount }: { amount: Wei }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const signer = useSigner();
  const { data: LegacyMarket } = useLegacyMarket();
  const { gasSpeed } = useGasSpeed();
  const provider = useDefaultProvider();
  const queryClient = useQueryClient();
  const { network } = useNetwork();

  const migrate = useCallback(async () => {
    try {
      if (!(LegacyMarket && signer && provider && network)) {
        throw 'OMFG';
      }
      setIsLoading(true);
      setIsSuccess(false);
      const gasPrices = await getGasPrice({ provider: signer.provider });

      const LegacyMarketContract = new ethers.Contract(
        LegacyMarket.address,
        LegacyMarket.abi,
        signer
      );

      const transaction = await LegacyMarketContract.populateTransaction.convertUSD(amount.toBN());
      const gasLimit = await provider?.estimateGas(transaction);

      const gasOptionsForTransaction = formatGasPriceForTransaction({
        gasLimit: wei(gasLimit || ZEROWEI).toBN(),
        gasPrices,
        gasSpeed,
      });

      const txn = await signer.sendTransaction({ ...transaction, ...gasOptionsForTransaction });

      await txWait(txn, network);

      setIsLoading(false);
      setIsSuccess(true);

      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
      });
    } catch (error) {
      if (LegacyMarket) {
        try {
          const LegacyMarketInterface = new ethers.utils.Interface(LegacyMarket.abi);
          const parsedError = extractErrorData(error);
          const errorResult = LegacyMarketInterface.parseError(parsedError as string);
          console.error('error:', errorResult);
        } catch {
          // whatever
        }
      }
      setIsLoading(false);
      throw error;
    }
  }, [LegacyMarket, signer, provider, network, amount, gasSpeed, queryClient]);

  return {
    migrate,
    isLoading,
    isSuccess,
  };
}
