import { Flex } from '@chakra-ui/react';
import { BASE_ANDROMEDA, MAINNET } from '@snx-v3/useBlockchain';
import { useOfflinePrices } from '@snx-v3/useCollateralPriceUpdates';
import { CollateralType, useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useOraclePrice } from '@snx-v3/useOraclePrice';
import { usePoolsList } from '@snx-v3/usePoolsList';
import React from 'react';
import { PoolCardsLoading } from './PoolCardsLoading';
import { PoolRow } from './PoolRow';

function HeaderText({ ...props }) {
  return (
    <Flex
      color="gray.600"
      fontFamily="heading"
      fontSize="12px"
      lineHeight="16px"
      letterSpacing={0.6}
      fontWeight={700}
      alignItems="center"
      justifyContent="right"
      {...props}
    />
  );
}

export function PoolsList() {
  const { data: poolsList, isPending: isPendingPoolsList } = usePoolsList();
  const { data: baseCollateralTypes, isPending: isPendingBaseCollateralTypes } = useCollateralTypes(
    false,
    BASE_ANDROMEDA
  );
  const { data: mainnetCollateralTypes, isPending: isPendingMainnetCollateralTypes } =
    useCollateralTypes(false, MAINNET);

  const allCollaterals: CollateralType[] = React.useMemo(() => {
    // We want to filter out assets that don't have a pyth price feed
    return [...(baseCollateralTypes ?? []), ...(mainnetCollateralTypes ?? [])].filter(
      (item) => item.symbol !== 'stataUSDC'
    );
  }, [baseCollateralTypes, mainnetCollateralTypes]);

  const { data: collateralPrices, isPending: isPendingCollateralPrices } = useOfflinePrices(
    allCollaterals.map((item) => ({
      id: item.tokenAddress,
      oracleId: item.oracleNodeId,
      symbol: item.symbol,
    }))
  );

  // Fetch stata price from oracle manager
  const stata = baseCollateralTypes?.find((item) => item.symbol === 'stataUSDC');

  const { data: stataPrice, isPending: isStataPriceLoading } = useOraclePrice(
    stata?.oracleNodeId,
    BASE_ANDROMEDA
  );

  const isPending =
    isPendingPoolsList ||
    isPendingCollateralPrices ||
    isPendingBaseCollateralTypes ||
    isPendingMainnetCollateralTypes ||
    isStataPriceLoading;

  const filteredPools = React.useMemo(() => {
    if (!poolsList?.synthetixPools) {
      return [];
    }

    return poolsList.synthetixPools.map(({ network, poolInfo, apr }) => {
      const collateralDeposited = poolInfo.map(({ collateral_type }) => ({
        collateralDeposited: collateral_type.total_amount_deposited,
        tokenAddress: collateral_type.id,
      }));

      let collaterals: typeof baseCollateralTypes = [];

      if (network.id === BASE_ANDROMEDA.id) {
        collaterals = baseCollateralTypes;
      } else if (network.id === MAINNET.id) {
        collaterals = mainnetCollateralTypes;
      }

      const collateralTypes = collaterals?.map((item) => ({
        ...item,
        collateralDeposited:
          collateralDeposited.find(
            ({ tokenAddress }) => tokenAddress.toLowerCase() === item.tokenAddress.toLowerCase()
          )?.collateralDeposited || '0',
      }));

      return {
        network,
        poolInfo,
        apr,
        collateralDeposited,
        collateralTypes,
      };
    });
  }, [poolsList?.synthetixPools, baseCollateralTypes, mainnetCollateralTypes]);

  const allCollateralPrices = React.useMemo(() => {
    if (stata && stataPrice) {
      return collateralPrices?.concat({ symbol: 'stataUSDC', price: stataPrice?.price.toBN() });
    }
  }, [stata, collateralPrices, stataPrice]);

  return (
    <Flex mt={6} minW="1200px" overflowX="auto" direction="column" gap={4}>
      <Flex flexDir="row" w="100%" gap={4} py={3} px={4} whiteSpace="nowrap">
        <HeaderText width="260px" justifyContent="left">
          Collateral / Network
        </HeaderText>
        <HeaderText width="240px">Wallet Balance</HeaderText>
        <HeaderText width="240px">TVL</HeaderText>
        <HeaderText width="164px">APY / APR</HeaderText>
        <Flex minW="210px" flex="1" />
      </Flex>

      {isPending ? <PoolCardsLoading /> : null}
      {!isPending && filteredPools && allCollateralPrices ? (
        <Flex direction="column-reverse" gap={4}>
          {filteredPools.flatMap(
            ({ network, poolInfo, apr, collateralTypes }) =>
              collateralTypes?.map((collateralType) => (
                <PoolRow
                  key={`${network.id}-${collateralType.address}`}
                  pool={poolInfo?.[0]?.pool}
                  network={network}
                  apr={apr}
                  collateralType={collateralType}
                  collateralPrices={allCollateralPrices}
                />
              ))
          )}
        </Flex>
      ) : null}
    </Flex>
  );
}
