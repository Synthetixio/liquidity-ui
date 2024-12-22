import { calculateCRatio } from '@snx-v3/calculations';
import { POOL_ID } from '@snx-v3/constants';
import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { type LiquidityPositionType } from '@snx-v3/useLiquidityPosition';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { erc7412Call } from '@snx-v3/withERC7412';
import { wei } from '@synthetixio/wei';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useLiquidityPositions');

export const useLiquidityPositions = ({ accountId }: { accountId?: string }) => {
  const { data: CoreProxy } = useCoreProxy();
  const { data: collateralTypes } = useCollateralTypes();
  const { network } = useNetwork();
  const provider = useProviderForChain(network);
  const { data: systemToken } = useSystemToken();

  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'LiquidityPositions',
      { accountId },
      {
        contractsHash: contractsHash([CoreProxy]),
        collateralTypes: contractsHash([systemToken, ...(collateralTypes || [])]),
      },
    ],
    enabled: Boolean(
      network && provider && CoreProxy && systemToken && accountId && collateralTypes
    ),
    queryFn: async (): Promise<LiquidityPositionType[]> => {
      if (!(network && provider && CoreProxy && systemToken && accountId && collateralTypes)) {
        throw 'OMFG';
      }
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const getAccountAvailableSystemTokenCallPromised =
        CoreProxyContract.populateTransaction.getAccountAvailableCollateral(
          accountId,
          systemToken.address
        );
      const getPositionCollateralCallsPromised = collateralTypes.map((collateralType) =>
        CoreProxyContract.populateTransaction.getPositionCollateral(
          accountId,
          POOL_ID,
          collateralType.tokenAddress
        )
      );
      const getPositionDebtCallsPromised = collateralTypes.map((collateralType) =>
        CoreProxyContract.populateTransaction.getPositionDebt(
          accountId,
          POOL_ID,
          collateralType.tokenAddress
        )
      );
      const getCollateralPriceCallsPromised = collateralTypes.map((collateralType) =>
        CoreProxyContract.populateTransaction.getCollateralPrice(collateralType.tokenAddress)
      );
      const getAccountCollateralCallPromised = collateralTypes.map((collateralType) =>
        CoreProxyContract.populateTransaction.getAccountCollateral(
          accountId,
          collateralType.tokenAddress
        )
      );
      const calls = await Promise.all([
        getAccountAvailableSystemTokenCallPromised,
        ...getPositionCollateralCallsPromised,
        ...getPositionDebtCallsPromised,
        ...getCollateralPriceCallsPromised,
        ...getAccountCollateralCallPromised,
      ]);

      return await erc7412Call(
        network,
        provider,
        calls,
        (encoded) => {
          if (!Array.isArray(encoded) || calls.length !== encoded.length) {
            throw new Error('[useLiquidityPositions] Unexpected multicall response');
          }

          const [accountAvailableSystemToken] = CoreProxyContract.interface.decodeFunctionResult(
            'getAccountAvailableCollateral',
            encoded[0]
          );

          const liquidityPositions = collateralTypes.map((collateralType, i) => {
            const [positionCollateral] = CoreProxyContract.interface.decodeFunctionResult(
              'getPositionCollateral',
              encoded[1 + 0 * collateralTypes.length + i]
            );

            const [positionDebt] = CoreProxyContract.interface.decodeFunctionResult(
              'getPositionDebt',
              encoded[1 + 1 * collateralTypes.length + i]
            );

            const [collateralPriceRaw] = CoreProxyContract.interface.decodeFunctionResult(
              'getCollateralPrice',
              encoded[1 + 2 * collateralTypes.length + i]
            );

            const [totalDepositedBigNumber, totalAssignedBigNumber, totalLockedBigNumber] =
              CoreProxyContract.interface.decodeFunctionResult(
                'getAccountCollateral',
                encoded[1 + 3 * collateralTypes.length + i]
              );

            const totalDeposited = wei(totalDepositedBigNumber);
            const totalAssigned = wei(totalAssignedBigNumber);
            const totalLocked = wei(totalLockedBigNumber);

            log({
              collateralType,
              positionCollateral,
              positionDebt,
              collateralPriceRaw,
              totalDeposited,
              totalAssigned,
              totalLocked,
            });

            const availableCollateral = wei(totalDeposited.sub(totalAssigned).sub(totalLocked));
            const availableSystemToken = wei(accountAvailableSystemToken);

            const collateralPrice = wei(collateralPriceRaw);
            const collateralAmount = wei(positionCollateral);
            const collateralValue = collateralAmount.mul(collateralPrice);
            const debt = wei(positionDebt);
            const cRatio = calculateCRatio(debt, collateralValue);

            return {
              collateralType,
              collateralPrice,
              availableCollateral,
              availableSystemToken,
              collateralAmount,
              collateralValue,
              debt,
              cRatio,
              totalDeposited,
              totalAssigned,
              totalLocked,
            };
          });
          log(liquidityPositions);

          liquidityPositions.forEach((liquidityPosition) => {
            queryClient.setQueryData(
              [
                `${network?.id}-${network?.preset}`,
                'LiquidityPosition',
                { accountId },
                { tokenAddress: liquidityPosition.collateralType.tokenAddress },
                {
                  contractsHash: contractsHash([CoreProxy]),
                  collateralTypes: contractsHash([systemToken, liquidityPosition.collateralType]),
                },
              ],
              liquidityPosition
            );
          });
          return liquidityPositions;
        },
        'useLiquidityPositions'
      );
    },
  });
};
