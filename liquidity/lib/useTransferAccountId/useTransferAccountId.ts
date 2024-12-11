import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useSigner, useWallet } from '@snx-v3/useBlockchain';
import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { txWait } from '@snx-v3/txWait';

export function useTransferAccountId(to: string, accountId: string) {
  const { data: AccountProxy } = useAccountProxy();
  const { activeWallet } = useWallet();
  const signer = useSigner();
  const { network } = useNetwork();
  const walletAddress = activeWallet?.address;

  return useMutation({
    mutationFn: async () => {
      if (!AccountProxy) throw new Error('AccountProxy not defined');
      if (!(walletAddress && signer && network)) throw new Error('Wallet is not connected');
      const AccountProxyContract = new ethers.Contract(
        AccountProxy.address,
        AccountProxy.abi,
        signer
      );
      const txn = await AccountProxyContract.transferFrom(walletAddress, to, accountId);
      const response = await txWait(txn, network);
      return response;
    },
  });
}
