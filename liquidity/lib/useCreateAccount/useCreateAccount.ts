import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useCreateAccount');

export function useCreateAccount() {
  const { data: CoreProxy } = useCoreProxy();
  const signer = useSigner();
  const { network } = useNetwork();
  const provider = useProvider();

  const client = useQueryClient();
  return {
    enabled: Boolean(network && CoreProxy),
    mutation: useMutation({
      mutationFn: async function () {
        if (!(CoreProxy && signer && provider)) throw 'OMFG';

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
        const txn = await CoreProxyContract['createAccount()']();
        log('txn', txn);
        const receipt = await provider.waitForTransaction(txn.hash);
        log('receipt', receipt);

        let newAccountId;

        receipt.logs.forEach((log) => {
          if (log.topics[0] === CoreProxyContract.interface.getEventTopic('AccountCreated')) {
            const [accountId] = CoreProxyContract.interface.decodeEventLog(
              'AccountCreated',
              log.data,
              log.topics
            );
            newAccountId = accountId;
          }
        });
        log('newAccountId', newAccountId);

        await client.invalidateQueries({
          queryKey: [`${network?.id}-${network?.preset}`, 'Accounts'],
        });

        if (newAccountId) {
          return newAccountId;
        } else {
          throw new Error('Could not find new account id');
        }
      },
    }),
  };
}
