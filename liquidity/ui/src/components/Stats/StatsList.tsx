import { Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { useAccountCollateral } from '@snx-v3/useAccountCollateral';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralPrices } from '@snx-v3/useCollateralPrices';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useGetUSDTokens } from '@snx-v3/useGetUSDTokens';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenBalances } from '@snx-v3/useTokenBalance';
import { wei } from '@synthetixio/wei';
import { useMemo } from 'react';
import {
  calculateAssets,
  calculateTotalAssetsAvailable,
  calculateTotalAssetsLocked,
} from '../../utils/assets';
import { calculateDebt } from '../../utils/positions';
import { StatBox } from './StatBox';

export const StatsList = () => {
  const params = useParams();
  const { network } = useNetwork();

  const { data: usdTokens } = useGetUSDTokens();

  const { data: liquidityPositions, isPending: isPendingLiquidityPositions } =
    useLiquidityPositions({
      accountId: params.accountId,
    });
  const { data: collateralTypes, isPending: isPendingCollateralTypes } = useCollateralTypes();

  const { data: accountCollaterals, isPending: isPendingAccountCollaterals } = useAccountCollateral(
    {
      accountId: params.accountId,
    }
  );

  const collateralAddresses =
    isBaseAndromeda(network?.id, network?.preset) && usdTokens?.USDC
      ? accountCollaterals?.map((collateral) => collateral.tokenAddress).concat(usdTokens.USDC) ||
        []
      : accountCollaterals?.map((collateral) => collateral.tokenAddress) || [];

  const { data: userTokenBalances, isPending: isPendingTokenBalances } = useTokenBalances(
    collateralAddresses.filter(Boolean)
  );

  const associatedUserBalances = userTokenBalances?.map((balance, index) => {
    return {
      balance,
      tokenAddress: collateralAddresses[index],
    };
  });

  const { data: collateralPrices, isPending: isPendingCollateralPrices } = useCollateralPrices();

  const isBase = isBaseAndromeda(network?.id, network?.preset);

  const { data: systemToken } = useSystemToken();
  const assets = useMemo(
    () =>
      calculateAssets(
        accountCollaterals,
        associatedUserBalances,
        collateralPrices,
        collateralTypes,
        isBase,
        usdTokens?.USDC,
        systemToken
      ),
    [
      accountCollaterals,
      associatedUserBalances,
      collateralPrices,
      collateralTypes,
      isBase,
      usdTokens?.USDC,
      systemToken,
    ]
  );

  const debt = calculateDebt(liquidityPositions);
  const totalAssets = calculateTotalAssetsAvailable(assets);
  const totalLocked = calculateTotalAssetsLocked(assets);

  const isPending =
    isPendingAccountCollaterals ||
    isPendingTokenBalances ||
    isPendingCollateralPrices ||
    isPendingLiquidityPositions ||
    isPendingCollateralTypes;

  return (
    <Flex flexWrap="wrap" w="100%" gap="4" mt={6}>
      <StatBox
        title="Available to Lock"
        isLoading={Boolean(params.accountId && isPending)}
        value={<Amount prefix="$" value={wei(totalAssets || '0')} />}
        label={
          <>
            <Text textAlign="left">
              Total assets that can be Locked, including:
              <br /> - Unlocked assets not yet withdrawn
              <br /> - Available assets in your wallet
            </Text>
          </>
        }
      />
      <StatBox
        title="Total Locked"
        isLoading={Boolean(params.accountId && isPending)}
        value={<Amount prefix="$" value={wei(totalLocked || '0')} />}
        label={
          <>
            <Text textAlign="left">All assets locked in Positions </Text>
          </>
        }
      />
      <StatBox
        title={`Total ${isBase ? 'PNL' : 'Debt'}`}
        isLoading={Boolean(params.accountId && isPending)}
        value={<Amount prefix="$" value={debt?.abs() || ZEROWEI} />}
        label={
          <>
            <Text textAlign="left">
              Aggregated {isBase ? 'PNL' : 'Debt'} of all your open Positions
            </Text>
          </>
        }
      />
    </Flex>
  );
};
