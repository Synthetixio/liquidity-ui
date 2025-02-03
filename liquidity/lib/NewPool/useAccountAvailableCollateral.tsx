import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useAccountAvailableCollateral');

export function useAccountAvailableCollateral() {
  const [params] = useParams<PositionPageSchemaType>();

  const provider = useProvider();
  const { network } = useNetwork();

  const { data: collateralType } = useCollateralType('SNX');
  const { data: CoreProxy } = useCoreProxy();

  const accountId = params.accountId;
  const collateralAddress = collateralType?.tokenAddress;

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'New Pool',
      'accountAvailableCollateral',
      { accountId, collateralAddress },
      { contractsHash: contractsHash([CoreProxy]) },
    ],
    enabled: Boolean(network && provider && CoreProxy && accountId && collateralAddress),
    queryFn: async () => {
      if (!(network && provider && CoreProxy && accountId && collateralAddress)) {
        throw new Error('OMFG');
      }
      log({ accountId, collateralAddress });
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
      const accountAvailableCollateral = await CoreProxyContract.getAccountAvailableCollateral(
        accountId,
        collateralAddress
      );
      log('accountAvailableCollateral', accountAvailableCollateral);

      return accountAvailableCollateral;
    },
  });
}
