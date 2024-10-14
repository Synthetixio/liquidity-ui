import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useSigner, useWallet } from '@snx-v3/useBlockchain';
import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useTransferAccountId(to: string, accountId: string) {
  const { data: AccountProxy } = useAccountProxy();
  const { activeWallet } = useWallet();
  const signer = useSigner();
  const walletAddress = activeWallet?.address;

  return useMutation({
    mutationFn: async () => {
      if (!AccountProxy) throw new Error('AccountProxy not defined');
      if (!(walletAddress && signer)) throw new Error('Wallet is not connected');
      const AccountProxyContract = new ethers.Contract(
        AccountProxy.address,
        AccountProxy.abi,
        signer
      );
      const tx = await AccountProxyContract.transferFrom(walletAddress, to, accountId);
      const response = await tx.wait();
      return response;
    },
  });
}
