import { useNetwork, useProvider, useSigner, useWallet } from '@snx-v3/useBlockchain';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useUnwrapStataUSDC');

export function useUnwrapStataUSDC() {
  const signer = useSigner();
  const provider = useProvider();
  const { network } = useNetwork();

  const { data: StaticAaveUSDC } = useStaticAaveUSDC();
  const queryClient = useQueryClient();
  const { activeWallet } = useWallet();

  return useMutation({
    mutationFn: async (amount: ethers.BigNumber) => {
      if (!StaticAaveUSDC || !signer || !provider || amount.lte(0)) {
        return;
      }
      const StaticAaveUSDCContract = new ethers.Contract(
        StaticAaveUSDC.address,
        StaticAaveUSDC.abi,
        signer
      );

      const transaction = await StaticAaveUSDCContract.populateTransaction.withdraw(
        amount.toString(),
        activeWallet?.address,
        activeWallet?.address
      );

      const gasLimit = await provider.estimateGas(transaction);

      const txn = await signer.sendTransaction({
        ...transaction,
        gasLimit: gasLimit.mul(15).div(10),
      });
      log('txn', txn);
      const receipt = await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);
      return receipt;
    },

    onSuccess: async () => {
      const deployment = `${network?.id}-${network?.preset}`;
      await Promise.all(
        [
          //
          'TokenBalance',
          'EthBalance',
        ].map((key) => queryClient.invalidateQueries({ queryKey: [deployment, key] }))
      );
    },
  });
}
