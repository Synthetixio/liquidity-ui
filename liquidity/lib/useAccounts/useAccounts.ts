import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BigNumber } from 'ethers';
import { useProvider, useSigner } from '@snx-v3/useBlockchain';
import { contractsHash } from '@snx-v3/tsHelpers';
import { ethers } from 'ethers';
import { txWait } from '@snx-v3/txWait';

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

      const numberOfAccountTokens = await AccountProxyContract.balanceOf(activeWallet.address);

      if (numberOfAccountTokens.eq(0)) {
        // No accounts created yet
        return [];
      }
      const accountIndexes = Array.from(Array(numberOfAccountTokens.toNumber()).keys());

      const calls = accountIndexes.map((index) => ({
        target: AccountProxy.address,
        callData: AccountProxyContract.interface.encodeFunctionData('tokenOfOwnerByIndex', [
          activeWallet.address,
          index,
        ]),
      }));
      const { returnData } = await Multicall3Contract.callStatic.aggregate(calls);

      const accounts = (returnData as string[]).map(
        (data) =>
          AccountProxyContract.interface.decodeFunctionResult('tokenOfOwnerByIndex', data)[0]
      ) as BigNumber[];

      return accounts.map((accountId) => accountId.toString());
    },
    placeholderData: [],
  });
}

export function useCreateAccount() {
  const { data: CoreProxy } = useCoreProxy();
  const signer = useSigner();
  const { network } = useNetwork();
  const client = useQueryClient();
  return {
    enabled: Boolean(network && CoreProxy),
    mutation: useMutation({
      mutationFn: async function () {
        try {
          if (!(CoreProxy && signer && network)) throw 'OMFG';

          const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
          const tx = await CoreProxyContract['createAccount()']();
          const res = await txWait(tx, network);

          await client.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'Accounts'],
          });

          let newAccountId: string | undefined;

          res.logs.forEach((log: any) => {
            if (log.topics[0] === CoreProxyContract.interface.getEventTopic('AccountCreated')) {
              const accountId = CoreProxyContract.interface.decodeEventLog(
                'AccountCreated',
                log.data,
                log.topics
              )?.accountId;
              newAccountId = accountId?.toString();
            }
          });

          return [newAccountId];
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
    }),
  };
}
