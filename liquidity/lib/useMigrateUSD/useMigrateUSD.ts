import { extractErrorData } from '@snx-v3/parseContractError';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useLegacyMarket } from '@snx-v3/useLegacyMarket';
import Wei from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useCallback, useState } from 'react';

const log = debug('snx:useMigrateUSD');

export function useMigrateUSD({ amount }: { amount: Wei }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const signer = useSigner();
  const { data: LegacyMarket } = useLegacyMarket();
  const { gasSpeed } = useGasSpeed();
  const provider = useProvider();
  const queryClient = useQueryClient();
  const { network } = useNetwork();

  const migrate = useCallback(async () => {
    try {
      if (!(LegacyMarket && signer && provider)) {
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
        gasLimit,
        gasPrices,
        gasSpeed,
      });

      const txn = await signer.sendTransaction({ ...transaction, ...gasOptionsForTransaction });
      log('txn', txn);
      const receipt = log.enabled ? await txn.wait() : await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);

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
  }, [amount, gasSpeed, LegacyMarket, network?.id, network?.preset, provider, queryClient, signer]);

  return {
    migrate,
    isLoading,
    isSuccess,
  };
}
