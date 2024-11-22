import { ZEROWEI } from '@snx-v3/constants';
import { extractErrorData } from '@snx-v3/parseContractError';
import { contractsHash } from '@snx-v3/tsHelpers';
import { useDefaultProvider, useNetwork, useSigner } from '@snx-v3/useBlockchain';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useLegacyMarket } from '@snx-v3/useLegacyMarket';
import { wei } from '@synthetixio/wei';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useCallback, useMemo, useState } from 'react';

export function useMigrate() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { network } = useNetwork();
  const provider = useDefaultProvider();
  const signer = useSigner();
  const { data: LegacyMarket } = useLegacyMarket();
  const { gasSpeed } = useGasSpeed();
  const queryClient = useQueryClient();

  const accountId = useMemo(() => Math.floor(Math.random() * 1000000000000).toString(), []);

  const { data: transaction } = useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'MigrateTxn',
      { contractsHash: contractsHash([LegacyMarket]) },
    ],
    enabled: Boolean(signer && LegacyMarket),
    queryFn: async function () {
      if (!(LegacyMarket && signer)) throw 'OMFG';

      const LegacyMarketContract = new ethers.Contract(
        LegacyMarket.address,
        LegacyMarket.abi,
        signer
      );

      const signerAddress = await signer.getAddress();
      const populateTransaction = await LegacyMarketContract.populateTransaction.migrate(
        accountId,
        { from: signerAddress }
      );
      try {
        const [gasLimit, feeData] = await Promise.all([
          await provider?.estimateGas(populateTransaction),
          await provider?.getFeeData(),
        ]);

        const gasPrices = await getGasPrice({ provider: signer.provider });
        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit: wei(gasLimit || ZEROWEI).toBN(),
          gasPrices,
          gasSpeed,
        });

        return {
          ...populateTransaction,
          gasLimit: gasOptionsForTransaction.gasLimit,
          gasPrice: feeData?.gasPrice,
        };
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
        return null;
      }
    },
  });

  const migrate = useCallback(async () => {
    try {
      if (!(LegacyMarket && signer && transaction)) throw 'OMFG';
      setIsLoading(true);
      setIsSuccess(false);
      const gasPrices = await getGasPrice({ provider: signer.provider });
      const signerAddress = await signer.getAddress();

      const LegacyMarketContract = new ethers.Contract(
        LegacyMarket.address,
        LegacyMarket.abi,
        signer
      );

      const populateTransaction = await LegacyMarketContract.populateTransaction.migrate(
        accountId,
        { from: signerAddress }
      );
      const gasLimit = await provider?.estimateGas(populateTransaction);

      const gasOptionsForTransaction = formatGasPriceForTransaction({
        gasLimit: wei(gasLimit || ZEROWEI).toBN(),
        gasPrices,
        gasSpeed,
      });

      const txn = await LegacyMarketContract.migrate(accountId, {
        ...gasOptionsForTransaction,
      });
      await txn.wait();

      setIsLoading(false);
      setIsSuccess(true);

      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'Accounts'],
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [
    accountId,
    gasSpeed,
    LegacyMarket,
    network?.id,
    network?.preset,
    provider,
    queryClient,
    signer,
    transaction,
  ]);

  return {
    migrate,
    transaction,
    isLoading,
    isSuccess,
    accountId,
  };
}
