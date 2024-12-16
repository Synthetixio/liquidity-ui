import { POOL_ID } from '@snx-v3/constants';
import { contractsHash } from '@snx-v3/tsHelpers';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { erc7412Call } from '@snx-v3/withERC7412';
import { ZodBigNumber } from '@snx-v3/zod';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { z } from 'zod';

const VaultCollateralSchema = z
  .object({ value: ZodBigNumber, amount: ZodBigNumber })
  .transform(({ value, amount }) => ({ value: wei(value), amount: wei(amount) }));
const VaultDebtSchema = ZodBigNumber.transform((x) => wei(x));

export const useVaultsData = (customNetwork?: Network) => {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;

  const { data: collateralTypes } = useCollateralTypes(false, customNetwork);
  const { data: CoreProxy } = useCoreProxy(customNetwork);

  const provider = useProviderForChain(targetNetwork);

  return useQuery({
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'VaultCollaterals',
      { contractsHash: contractsHash([CoreProxy, ...(collateralTypes ?? [])]) },
    ],
    enabled: Boolean(CoreProxy && collateralTypes && targetNetwork && provider),
    queryFn: async () => {
      if (!(CoreProxy && collateralTypes && targetNetwork && provider)) {
        throw Error('useVaultsData should not be enabled when missing data');
      }

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
      const collateralCallsP = Promise.all(
        collateralTypes.map((collateralType) =>
          CoreProxyContract.populateTransaction.getVaultCollateral(
            POOL_ID,
            collateralType.tokenAddress
          )
        )
      );

      const debtCallsP = Promise.all(
        collateralTypes.map((collateralType) =>
          CoreProxyContract.populateTransaction.getVaultDebt(POOL_ID, collateralType.tokenAddress)
        )
      );

      const allCalls = await Promise.all([collateralCallsP, debtCallsP]);

      return await erc7412Call(
        targetNetwork,
        provider,
        allCalls.flat(),
        (multicallResult) => {
          if (!Array.isArray(multicallResult)) throw Error('Expected array');

          const collateralResult = multicallResult.slice(0, collateralTypes.length);
          const debtResult = multicallResult.slice(collateralTypes.length);

          return collateralResult.map((bytes: string, i: number) => {
            const debtBytes =
              debtResult[i] || '0x0000000000000000000000000000000000000000000000000000000000000000';

            const CoreProxyInterface = new ethers.utils.Interface(CoreProxy.abi);

            const decodedDebt = CoreProxyInterface.decodeFunctionResult('getVaultDebt', debtBytes);
            const decodedCollateral = CoreProxyInterface.decodeFunctionResult(
              'getVaultCollateral',
              bytes
            );
            const collateral = VaultCollateralSchema.parse({ ...decodedCollateral });
            const debt = VaultDebtSchema.parse(decodedDebt[0]);
            return {
              debt,
              collateral,
              collateralType: collateralTypes[i],
            };
          });
        },
        'useVaultsData'
      );
    },
  });
};

export type VaultsDataType = ReturnType<typeof useVaultsData>['data'];
