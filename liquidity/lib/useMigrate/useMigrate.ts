import { extractErrorData } from '@snx-v3/parseContractError';
import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useLegacyMarket } from '@snx-v3/useLegacyMarket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import { useCallback, useMemo, useState } from 'react';

const log = debug('snx:useMigrate');

export function useMigrate() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { network } = useNetwork();
  const provider = useProvider();
  const signer = useSigner();
  const { data: LegacyMarket } = useLegacyMarket();
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
      if (!(LegacyMarket && signer && provider)) throw 'OMFG';

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
        const gasLimit = await provider.estimateGas(populateTransaction);
        return {
          ...populateTransaction,
          gasLimit: gasLimit.mul(15).div(10),
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
      if (!(LegacyMarket && signer && provider && transaction)) throw 'OMFG';
      setIsLoading(true);
      setIsSuccess(false);
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
      const gasLimit = await provider.estimateGas(populateTransaction);
      const txn = await LegacyMarketContract.migrate(accountId, {
        gasLimit: gasLimit.mul(15).div(10),
      });
      log('txn', txn);
      const receipt = await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);

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
