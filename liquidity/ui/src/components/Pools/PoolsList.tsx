import { Divider, Flex, Heading, Text } from '@chakra-ui/react';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ARBITRUM, BASE_ANDROMEDA, MAINNET } from '@snx-v3/useBlockchain';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { usePoolsList } from '@snx-v3/usePoolsList';
import { useRewardsDistributors } from '@snx-v3/useRewardsDistributors';
import { useMemo, useReducer } from 'react';
import { ChainFilter, CollateralFilter } from './';
import { Balloon } from './Balloon';
import { PoolCardsLoading } from './PoolCards/PoolCardsLoading';
import { PoolRow } from './PoolCards/PoolRow';
import { TorosPoolCard } from './PoolCards/TorosPoolCard';

export const PoolsList = () => {
  const [state, dispatch] = useReducer(poolsReducer, { collaterals: [], chains: [] });
  const { data, isPending: isPoolsListLoading } = usePoolsList();

  const { data: BaseCollateralTypes, isPending: isBaseCollateralLoading } = useCollateralTypes(
    false,
    BASE_ANDROMEDA
  );

  const { data: ArbitrumCollateralTypes, isPending: isArbCollateralLoading } = useCollateralTypes(
    false,
    ARBITRUM
  );

  const { data: MainnetCollateralTypes, isPending: isMainCollateralLoading } = useCollateralTypes(
    false,
    MAINNET
  );

  // Arb Rewards
  const { data: ArbitrumRewards, isPending: isArbitrumRewardsLoading } =
    useRewardsDistributors(ARBITRUM);

  // Base Rewards
  const { data: BaseRewards, isPending: isBaseRewardsLoading } =
    useRewardsDistributors(BASE_ANDROMEDA);

  // Mainnet Rewards
  const { data: MainRewards, isPending: isMainRewardsLoading } = useRewardsDistributors(MAINNET);

  const { collaterals, chains } = state;

  const isLoading =
    isPoolsListLoading ||
    isBaseCollateralLoading ||
    isArbCollateralLoading ||
    isMainCollateralLoading ||
    isArbitrumRewardsLoading ||
    isBaseRewardsLoading ||
    isMainRewardsLoading;

  const filteredPools = useMemo(() => {
    return (
      data?.synthetixPools
        .map(({ network, poolInfo, apr }) => {
          const collateralDeposited = poolInfo.map(({ collateral_type }) => ({
            collateralDeposited: collateral_type.total_amount_deposited,
            tokenAddress: collateral_type.id,
          }));

          let collaterals: typeof ArbitrumCollateralTypes = [];
          let rewardsDistributors: any = {};

          if (network.id === ARBITRUM.id) {
            collaterals = ArbitrumCollateralTypes;
            rewardsDistributors = ArbitrumRewards;
          } else if (network.id === BASE_ANDROMEDA.id) {
            collaterals = BaseCollateralTypes;
            rewardsDistributors = BaseRewards;
          } else if (network.id === MAINNET.id) {
            collaterals = MainnetCollateralTypes;
            rewardsDistributors = MainRewards;
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
            rewardsDistributors,
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
    data?.synthetixPools,
    ArbitrumCollateralTypes,
    ArbitrumRewards,
    BaseCollateralTypes,
    BaseRewards,
    MainnetCollateralTypes,
    MainRewards,
    chains,
    collaterals,
  ]);

  return (
    <Flex mt={6} flexDirection="column">
      <Heading fontWeight={700} fontSize={24}>
        Pools
      </Heading>
      <Flex flexWrap="wrap" gap={4} justifyContent="space-between" my={6}>
        <ChainFilter activeChains={state.chains} dispatch={dispatch} />
        <CollateralFilter activeCollaterals={state.collaterals} dispatch={dispatch} />
      </Flex>
      <Flex minW="1200px" overflowX="auto" direction="column" gap={4}>
        <Divider width="100%" />
        <Flex gap={4} px={4} py={3}>
          <Text
            color="gray.600"
            fontFamily="heading"
            fontSize="12px"
            lineHeight="16px"
            letterSpacing={0.6}
            fontWeight={700}
            width="190px"
          >
            Collateral/Network
          </Text>

          <Text
            color="gray.600"
            fontFamily="heading"
            fontSize="12px"
            lineHeight="16px"
            letterSpacing={0.6}
            fontWeight={700}
            width="220px"
            textAlign="right"
          >
            Wallet Balance
          </Text>

          <Text
            color="gray.600"
            fontFamily="heading"
            fontSize="12px"
            lineHeight="16px"
            letterSpacing={0.6}
            fontWeight={700}
            width="189px"
            textAlign="right"
          >
            Pool / Owner
          </Text>

          <Text
            color="gray.600"
            fontFamily="heading"
            fontSize="12px"
            lineHeight="16px"
            letterSpacing={0.6}
            fontWeight={700}
            width="144px"
            textAlign="right"
          >
            TVL
          </Text>

          <Text
            color="gray.600"
            fontFamily="heading"
            fontSize="12px"
            lineHeight="16px"
            letterSpacing={0.6}
            fontWeight={700}
            width="144px"
            textAlign="right"
          >
            APY/APR
          </Text>
          <Text
            color="gray.600"
            fontFamily="heading"
            fontSize="12px"
            lineHeight="16px"
            letterSpacing={0.6}
            fontWeight={700}
            width="121px"
            textAlign="right"
          >
            Specifics
          </Text>
          <Flex minW="159px" flex="1" />
        </Flex>
        {isLoading && !filteredPools?.length ? <PoolCardsLoading /> : null}
        {(!chains.length || chains.includes(BASE_ANDROMEDA.id)) &&
        (!collaterals.length || collaterals.includes('USDC')) ? (
          <TorosPoolCard token="USDC" />
        ) : null}
        {(!chains.length || chains.includes(ARBITRUM.id)) &&
        (!collaterals.length || collaterals.includes('wstETH')) ? (
          <TorosPoolCard token="wstETH" />
        ) : null}
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
                  ?.map((collateralType) => (
                    <PoolRow
                      key={collateralType.tokenAddress + network.id}
                      pool={poolInfo[0].pool}
                      network={network}
                      apr={apr}
                      collateralType={collateralType}
                    />
                  ))
            )
          : null}

        {!isLoading && !filteredPools?.length && (
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
};

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
