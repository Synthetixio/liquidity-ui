import { calculateCRatio } from '@snx-v3/calculations';
import { POOL_ID } from '@snx-v3/constants';
import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { CollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { erc7412Call } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useLiquidityPosition');

export type LiquidityPositionType = {
  collateralType: CollateralType;
  collateralPrice: Wei;
  availableCollateral: Wei;
  availableSystemToken: Wei;
  collateralAmount: Wei;
  collateralValue: Wei;
  debt: Wei;
  cRatio: Wei;
  totalDeposited: Wei;
  totalAssigned: Wei;
  totalLocked: Wei;
};

export const useLiquidityPosition = ({
  accountId,
  collateralType,
}: {
  accountId?: string;
  collateralType?: CollateralType;
}) => {
  const { data: CoreProxy } = useCoreProxy();
  const { network } = useNetwork();
  const provider = useProviderForChain(network!);
  const { data: systemToken } = useSystemToken();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'LiquidityPosition',
      { accountId },
      { tokenAddress: collateralType?.tokenAddress },
      { contractsHash: contractsHash([CoreProxy, systemToken]) },
    ],
    enabled: Boolean(
      network && provider && CoreProxy && systemToken && accountId && collateralType
    ),
    queryFn: async (): Promise<LiquidityPositionType> => {
      if (!(network && provider && CoreProxy && systemToken && accountId && collateralType)) {
        throw 'OMFG';
      }
      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, provider);

      const getAccountAvailableSystemTokenCallPromised =
        CoreProxyContract.populateTransaction.getAccountAvailableCollateral(
          accountId,
          systemToken.address
        );
      const getPositionCollateralCallPromised =
        CoreProxyContract.populateTransaction.getPositionCollateral(
          accountId,
          POOL_ID,
          collateralType.tokenAddress
        );
      const getPositionDebtCallPromised = CoreProxyContract.populateTransaction.getPositionDebt(
        accountId,
        POOL_ID,
        collateralType.tokenAddress
      );
      const getCollateralPriceCallPromised =
        CoreProxyContract.populateTransaction.getCollateralPrice(collateralType.tokenAddress);

      const getAccountCollateralCallPromised =
        CoreProxyContract.populateTransaction.getAccountCollateral(
          accountId,
          collateralType.tokenAddress
        );

      const calls = await Promise.all([
        getAccountAvailableSystemTokenCallPromised,
        getPositionCollateralCallPromised,
        getPositionDebtCallPromised,
        getCollateralPriceCallPromised,
        getAccountCollateralCallPromised,
      ]);

      return await erc7412Call(
        network,
        provider,
        calls,
        (encoded) => {
          if (!Array.isArray(encoded) || calls.length !== encoded.length) {
            throw new Error('[useLiquidityPositions] Unexpected multicall response');
          }

          log('collateralType', collateralType);

          const [accountAvailableSystemToken] = CoreProxyContract.interface.decodeFunctionResult(
            'getAccountAvailableCollateral',
            encoded[0]
          );
          log('accountAvailableSystemToken', accountAvailableSystemToken);

          const [positionCollateral] = CoreProxyContract.interface.decodeFunctionResult(
            'getPositionCollateral',
            encoded[1]
          );
          log('positionCollateral', positionCollateral);

          const [positionDebt] = CoreProxyContract.interface.decodeFunctionResult(
            'getPositionDebt',
            encoded[1 + 1]
          );
          log('positionDebt', positionDebt);

          const [collateralPriceRaw] = CoreProxyContract.interface.decodeFunctionResult(
            'getCollateralPrice',
            encoded[1 + 2]
          );
          log('collateralPriceRaw', collateralPriceRaw);

          const [totalDepositedBigNumber, totalAssignedBigNumber, totalLockedBigNumber] =
            CoreProxyContract.interface.decodeFunctionResult(
              'getAccountCollateral',
              encoded[1 + 3]
            );

          const totalDeposited = wei(totalDepositedBigNumber);
          const totalAssigned = wei(totalAssignedBigNumber);
          const totalLocked = wei(totalLockedBigNumber);
          log('totalDeposited', totalDeposited);
          log('totalAssigned', totalAssigned);
          log('totalLocked', totalLocked);

          const availableCollateral = wei(totalDeposited.sub(totalAssigned).sub(totalLocked));
          const availableSystemToken = wei(accountAvailableSystemToken);

          const collateralPrice = wei(collateralPriceRaw);
          const collateralAmount = wei(positionCollateral);
          const collateralValue = collateralAmount.mul(collateralPrice);
          const debt = wei(positionDebt);
          const cRatio = calculateCRatio(debt, collateralValue);

          const liquidityPosition = {
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

          log('liquidityPosition', liquidityPosition);
          return liquidityPosition;
        },
        'useLiquidityPosition'
      );
    },
  });
};
