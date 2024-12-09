import { ZEROWEI } from '@snx-v3/constants';
import { useDefaultProvider, useSigner, useWallet } from '@snx-v3/useBlockchain';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { wei } from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useUnwrapStataUSDC() {
  const signer = useSigner();
  const { data: StaticAaveUSDC } = useStaticAaveUSDC();
  const { gasSpeed } = useGasSpeed();
  const provider = useDefaultProvider();
  const queryClient = useQueryClient();
  const { activeWallet } = useWallet();

  return useMutation({
    mutationFn: async (amount: ethers.BigNumber) => {
      if (!StaticAaveUSDC || !signer || amount.lte(0)) {
        return;
      }
      const StaticAaveUSDCContract = new ethers.Contract(
        StaticAaveUSDC.address,
        StaticAaveUSDC.abi,
        signer
      );

      const gasPrices = await getGasPrice({ provider: signer!.provider });

      const transaction = await StaticAaveUSDCContract.populateTransaction.withdraw(
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
    },
    mutationKey: ['unwrapStataUSDC'],
    onSuccess: async () => {
      await queryClient.invalidateQueries({ exact: false, queryKey: ['TokenBalance'] });
      await queryClient.refetchQueries({ exact: false, queryKey: ['TokenBalance'] });
    },
  });
}
