import { stringToHash } from '@snx-v3/tsHelpers';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
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

export const useVaultsData = (poolId?: number, customNetwork?: Network) => {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;

  const { data: collateralTypes } = useCollateralTypes(false, customNetwork);
  const { data: CoreProxy } = useCoreProxy(customNetwork);

  const provider = useProviderForChain(targetNetwork);

  const { data: priceUpdateTx } = useCollateralPriceUpdates(customNetwork);

  return useQuery({
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'VaultCollaterals',
      {
        pool: poolId,
        tokens: collateralTypes ? collateralTypes?.map((x) => x.tokenAddress).sort() : [],
        priceUpdateTx: stringToHash(priceUpdateTx?.data),
      },
    ],
    enabled: Boolean(CoreProxy && collateralTypes && poolId && targetNetwork && provider),
    queryFn: async () => {
      if (!(CoreProxy && collateralTypes && poolId && targetNetwork && provider)) {
        throw Error('useVaultsData should not be enabled when missing data');
      }

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);
      const collateralCallsP = Promise.all(
        collateralTypes.map((collateralType) =>
          CoreProxyContract.populateTransaction.getVaultCollateral(
            poolId,
            collateralType.tokenAddress
          )
        )
      );

      const debtCallsP = Promise.all(
        collateralTypes.map((collateralType) =>
          CoreProxyContract.populateTransaction.getVaultDebt(poolId, collateralType.tokenAddress)
        )
      );

      const calls = await Promise.all([collateralCallsP, debtCallsP]);

      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      return await erc7412Call(
        targetNetwork,
        provider,
        calls.flat(),
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
