import { contractsHash } from '@snx-v3/tsHelpers';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useQuery } from '@tanstack/react-query';
import { BigNumber, ethers } from 'ethers';

export function useLocks(accountId?: string, collateralType?: string, customNetwork?: Network) {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const { data: CoreProxy } = useCoreProxy(targetNetwork);
  const provider = useProviderForChain(targetNetwork);

  return useQuery({
    enabled: Boolean(provider && CoreProxy),
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'Locks',
      { contractsHash: contractsHash([CoreProxy]), accountId, collateralType },
    ],
    queryFn: async () => {
      if (!(provider && CoreProxy && accountId && collateralType)) throw 'OMFG';

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const locks: {
        amountD18: BigNumber;
        lockExpirationTime: BigNumber;
      }[] = await CoreProxyContract.getLocks(accountId, collateralType, 0, 100);

      return locks.map((lock) => ({
        timestamp: lock.lockExpirationTime,
        expirationDate: new Date(lock.lockExpirationTime.toNumber() * 1000),
        amount: lock.amountD18,
      }));
    },
  });
}
