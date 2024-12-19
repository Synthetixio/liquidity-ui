import { ChevronUpIcon } from '@chakra-ui/icons';
import { Divider, Flex, Link, Text } from '@chakra-ui/react';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ARBITRUM, BASE_ANDROMEDA, MAINNET } from '@snx-v3/useBlockchain';
import { useOfflinePrices } from '@snx-v3/useCollateralPriceUpdates';
import { CollateralType, useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useOraclePrice } from '@snx-v3/useOraclePrice';
import { HomePageSchemaType, makeSearch, useParams } from '@snx-v3/useParams';
import { usePoolsList } from '@snx-v3/usePoolsList';
import React from 'react';
import { Balloon } from './Balloon';
import { ChainFilter } from './ChainFilter';
import { CollateralFilter } from './CollateralFilter';
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

function HeaderLink({ ...props }) {
  return (
    <HeaderText
      as={Link}
      textDecoration="none"
      _hover={{ color: 'gray.400', textDecoration: 'none' }}
      alignItems="center"
      justifyContent="right"
      {...props}
    />
  );
}

export function PoolsList() {
  const [state, dispatch] = React.useReducer(poolsReducer, { collaterals: [], chains: [] });
  const { data: poolsList, isPending: isPendingPoolsList } = usePoolsList();
  const [params, setParams] = useParams<HomePageSchemaType>();

  const { data: baseCollateralTypes, isPending: isPendingBaseCollateralTypes } = useCollateralTypes(
    false,
    BASE_ANDROMEDA
  );
  const { data: arbitrumCollateralTypes, isPending: isPendingArbitrumCollateralTypes } =
    useCollateralTypes(false, ARBITRUM);
  const { data: mainnetCollateralTypes, isPending: isPendingMainnetCollateralTypes } =
    useCollateralTypes(false, MAINNET);

  const allCollaterals: CollateralType[] = React.useMemo(() => {
    // We want to filter out assets that don't have a pyth price feed
    return [
      ...(baseCollateralTypes ?? []),
      ...(arbitrumCollateralTypes ?? []),
      ...(mainnetCollateralTypes ?? []),
    ].filter((item) => item.symbol !== 'stataUSDC');
  }, [arbitrumCollateralTypes, baseCollateralTypes, mainnetCollateralTypes]);

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

  const { collaterals, chains } = state;

  const isPending =
    isPendingPoolsList ||
    isPendingCollateralPrices ||
    isPendingBaseCollateralTypes ||
    isPendingArbitrumCollateralTypes ||
    isPendingMainnetCollateralTypes ||
    isStataPriceLoading;

  const filteredPools = React.useMemo(() => {
    return (
      poolsList?.synthetixPools
        .map(({ network, poolInfo, apr }) => {
          const collateralDeposited = poolInfo.map(({ collateral_type }) => ({
            collateralDeposited: collateral_type.total_amount_deposited,
            tokenAddress: collateral_type.id,
          }));

          let collaterals: typeof arbitrumCollateralTypes = [];

          if (network.id === ARBITRUM.id) {
            collaterals = arbitrumCollateralTypes;
          } else if (network.id === BASE_ANDROMEDA.id) {
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
        })
        .filter((pool) => {
          const { network, collateralTypes } = pool;
          if (chains.length > 0 && !chains.includes(network.id)) {
            return false;
          }

          const isCollateralFiltered = collateralTypes?.some((collateralType) =>
            collaterals.length
              ? !!collaterals.find((collateral) => {
                  if (
                    isBaseAndromeda(network.id, network.preset) &&
                    collateralType.symbol.toUpperCase() === 'SUSDC'
                  ) {
                    return collateral.toUpperCase() === 'USDC';
                  }
                  return collateral.toUpperCase() === collateralType.symbol.toUpperCase();
                })
              : true
          );

          if (!isCollateralFiltered) {
            return false;
          }

          return true;
        }) || []
    );
  }, [
    poolsList?.synthetixPools,
    arbitrumCollateralTypes,
    baseCollateralTypes,
    mainnetCollateralTypes,
    chains,
    collaterals,
  ]);

  const allCollateralPrices = React.useMemo(() => {
    if (stata && stataPrice) {
      return collateralPrices?.concat({ symbol: 'stataUSDC', price: stataPrice?.price.toBN() });
    }
  }, [stata, collateralPrices, stataPrice]);

  const sortBy = params.sort || 'tvl';

  const getSortParams = (sort: string) => {
    if (sortBy === sort) {
      return { ...params, dir: params.dir === 'asc' ? 'desc' : 'asc' };
    } else {
      return { ...params, sort: sort, dir: 'desc' };
    }
  };

  return (
    <Flex mt={6} flexDirection="column">
      <Flex flexWrap="wrap" gap={4} justifyContent="space-between" my={6}>
        <ChainFilter activeChains={state.chains} dispatch={dispatch} />
        <CollateralFilter activeCollaterals={state.collaterals} dispatch={dispatch} />
      </Flex>
      <Flex minW="1200px" overflowX="auto" direction="column" gap={4}>
        <Divider width="100%" />
        <Flex flexDir="row" w="100%" gap={4} py={3} px={4} whiteSpace="nowrap">
          <HeaderText width="240px" justifyContent="left">
            Collateral / Network
          </HeaderText>
          <HeaderLink
            width="220px"
            href={`?${makeSearch(getSortParams('balance'))}`}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              setParams(getSortParams('balance'));
            }}
          >
            {sortBy === 'balance' && (
              <ChevronUpIcon
                transform={params.dir === 'asc' ? undefined : 'rotate(180deg)'}
                mr={1}
              />
            )}
            Wallet Balance
          </HeaderLink>

          <HeaderLink
            width="220px"
            href={`?${makeSearch(getSortParams('tvl'))}`}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              setParams(getSortParams('tvl'));
            }}
          >
            {sortBy === 'tvl' && (
              <ChevronUpIcon
                transform={params.dir === 'asc' ? undefined : 'rotate(180deg)'}
                mr={1}
              />
            )}
            <Text>TVL</Text>
          </HeaderLink>

          <HeaderLink
            width="144px"
            href={`?${makeSearch(getSortParams('apy'))}`}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              setParams(getSortParams('apy'));
            }}
          >
            {sortBy === 'apy' && (
              <ChevronUpIcon
                transform={params.dir === 'asc' ? undefined : 'rotate(180deg)'}
                mr={1}
              />
            )}
            APY / APR
          </HeaderLink>
          <HeaderText width="121px">Specifics</HeaderText>
          <Flex minW="159px" flex="1" />
        </Flex>

        {isPending && !filteredPools?.length ? <PoolCardsLoading /> : null}
        <Flex direction={params.dir === 'asc' ? 'column' : 'column-reverse'} gap={4}>
          {filteredPools?.length > 0
            ? filteredPools.flatMap(
                ({ network, poolInfo, apr, collateralTypes }) =>
                  collateralTypes
                    ?.filter((collateralType) => {
                      if (!collaterals.length) {
                        return true;
                      }
                      return collaterals.includes(collateralType.symbol);
                    })
                    .map((collateralType) => (
                      <PoolRow
                        key={`${network.id}-${collateralType.address}`}
                        pool={poolInfo?.[0]?.pool}
                        network={network}
                        apr={apr}
                        collateralType={collateralType}
                        collateralPrices={allCollateralPrices}
                        sortBy={sortBy}
                      />
                    ))
              )
            : null}
        </Flex>

        {!isPending && !filteredPools?.length && (
          <Flex flexDir="column" alignItems="center">
            <Balloon mb={12} mt={6} />
            <Text mb={2} color="gray.500">
              No results found, select a different network or collateral
            </Text>

            <Text
              onClick={() => {
                dispatch({ type: 'RESET_CHAIN' });
                dispatch({ type: 'RESET_COLLATERAL' });
              }}
              cursor="pointer"
              fontWeight={700}
              color="cyan.500"
            >
              Clear Filters
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

interface PoolsFilterState {
  collaterals: string[];
  chains: number[];
}

export interface PoolsFilterAction {
  type:
    | 'ADD_COLLATERAL'
    | 'REMOVE_COLLATERAL'
    | 'ADD_CHAIN'
    | 'REMOVE_CHAIN'
    | 'RESET_COLLATERAL'
    | 'RESET_CHAIN';
  payload?: {
    collateral?: string;
    chain?: number;
  };
}

function poolsReducer(state: PoolsFilterState, action: PoolsFilterAction): PoolsFilterState {
  switch (action.type) {
    case 'ADD_COLLATERAL':
      if (action.payload?.collateral) {
        return {
          ...state,
          // Only one collateral active at once
          collaterals: [action.payload.collateral],
        };
      }

    case 'REMOVE_COLLATERAL':
      return {
        ...state,
        collaterals: state.collaterals.filter((item) => item !== action.payload?.collateral),
      };

    case 'ADD_CHAIN':
      if (action.payload?.chain) {
        // Only one chain active at once
        return {
          ...state,
          chains: [action.payload.chain],
        };
      }

    case 'REMOVE_CHAIN':
      return {
        ...state,
        chains: state.chains.filter((item) => item !== action.payload?.chain),
      };

    case 'RESET_COLLATERAL':
      return {
        collaterals: [],
        chains: state.chains,
      };

    case 'RESET_CHAIN':
      return {
        collaterals: state.collaterals,
        chains: [],
      };

    default:
      return state;
  }
}
