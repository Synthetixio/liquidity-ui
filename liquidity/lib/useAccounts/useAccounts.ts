import { contractsHash } from '@snx-v3/tsHelpers';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider, useWallet } from '@snx-v3/useBlockchain';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useAccounts');

export function useAccounts() {
  const { activeWallet } = useWallet();
  const { network } = useNetwork();
  const provider = useProvider();
  const { data: AccountProxy } = useAccountProxy();
  const { data: Multicall3 } = useMulticall3();
  const walletAddress = activeWallet?.address;

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'Accounts',
      { walletAddress },
      { contractsHash: contractsHash([AccountProxy, Multicall3]) },
    ],
    enabled: Boolean(provider && walletAddress && AccountProxy && Multicall3),
    queryFn: async function () {
      if (!(provider && walletAddress && AccountProxy && Multicall3)) throw 'OMFG';

      const AccountProxyContract = new ethers.Contract(
        AccountProxy.address,
        AccountProxy.abi,
        provider
      );
      const Multicall3Contract = new ethers.Contract(Multicall3.address, Multicall3.abi, provider);

      log('walletAddress', walletAddress);
      const numberOfAccountTokens = await AccountProxyContract.balanceOf(walletAddress);
      log('numberOfAccountTokens', numberOfAccountTokens);

      if (numberOfAccountTokens.eq(0)) {
        // No accounts created yet
        return [];
      }
      const accountIndexes: number[] = Array.from(Array(numberOfAccountTokens.toNumber()).keys());
      log('accountIndexes', accountIndexes);

      const calls = accountIndexes.map((index) => ({
        target: AccountProxy.address,
        callData: AccountProxyContract.interface.encodeFunctionData('tokenOfOwnerByIndex', [
          walletAddress,
          index,
        ]),
      }));

      const multicallResponse = await Multicall3Contract.callStatic.aggregate3(calls);
      log('multicallResponse', multicallResponse);

      const accounts = accountIndexes.map((index) => {
        const { returnData } = multicallResponse[index];
        const [tokenOfOwnerByIndex] = AccountProxyContract.interface.decodeFunctionResult(
          'tokenOfOwnerByIndex',
          returnData
        );
        return tokenOfOwnerByIndex;
      });
      log('accounts', accounts);

      return accounts;
    },
  });
}
