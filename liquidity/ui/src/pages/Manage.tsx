import { InfoIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { ManagePositionProvider } from '@snx-v3/ManagePositionContext';
import { Tooltip } from '@snx-v3/Tooltip';
import { useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { useCollateralType, useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useCombinedTokenBalance } from '@snx-v3/useCombinedTokenBalance';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { usePoolData } from '@snx-v3/usePoolData';
import { usePool } from '@snx-v3/usePoolsList';
import { useState } from 'react';
import {
  ManageAction,
  ManageStats,
  NoPosition,
  Rewards,
  UnsupportedCollateralAlert,
} from '../components';
import { ClosePosition } from '../components/ClosePosition/ClosePosition';
import { ManageLoading } from '../components/Manage/ManageLoading';
import { PositionTitle } from '../components/Manage/PositionTitle';
import { WatchAccountBanner } from '../components/WatchAccountBanner/WatchAccountBanner';

export const Manage = () => {
  const params = useParams();

  const { network } = useNetwork();
  const { activeWallet } = useWallet();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: combinedTokenBalance, isPending: isPendingCombinedTokenBalance } =
    useCombinedTokenBalance(collateralType);

  const { data: poolData } = usePoolData(params.poolId);

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    tokenAddress: collateralType?.tokenAddress,
    accountId: params.accountId,
    poolId: params.poolId,
  });

  const { data: collateralTypes, isPending: isPendingCollaterals } = useCollateralTypes();

  const notSupported =
    !isPendingCollaterals &&
    poolData &&
    collateralTypes?.length &&
    !isPendingCombinedTokenBalance &&
    !combinedTokenBalance;
  // collateralDisplayName &&
  // !collateralTypes.some((item) =>
  //   [item.symbol.toUpperCase(), item.displaySymbol.toUpperCase()].includes(
  //     collateralDisplayName.toUpperCase()
  //   )
  // );

  const [closePosition, setClosePosition] = useState(false);

  const { data: pool } = usePool(Number(network?.id), String(params.poolId));

  const [txnModalOpen, setTxnModalOpen] = useState<ManageAction | undefined>(undefined);
  const positionApr = pool?.apr?.collateralAprs?.find(
    (item: any) => item.collateralType.toLowerCase() === collateralType?.tokenAddress.toLowerCase()
  );

  const hasPosition = liquidityPosition && liquidityPosition.collateralAmount.gt(0);
  const hasAvailableCollateral =
    liquidityPosition && liquidityPosition.accountCollateral.availableCollateral.gt(0);

  return (
    <ManagePositionProvider>
      <WatchAccountBanner />
      {activeWallet ? (
        <>
          <UnsupportedCollateralAlert isOpen={Boolean(notSupported)} />

          {!params.accountId ? <NoPosition /> : null}

          {params.accountId && isPendingLiquidityPosition ? <ManageLoading /> : null}

          {params.accountId &&
          !isPendingLiquidityPosition &&
          !hasPosition &&
          !hasAvailableCollateral ? (
            <NoPosition />
          ) : null}

          {params.accountId &&
          !isPendingLiquidityPosition &&
          (hasPosition || hasAvailableCollateral) ? (
            <Box mb={12} mt={8}>
              <Flex
                flexDir={['column', 'row']}
                flexWrap="wrap"
                px={[0, 6]}
                alignItems="center"
                justifyContent="space-between"
                mb="8px"
                gap={4}
              >
                <PositionTitle />
                {pool && (
                  <Flex alignItems={['center', 'flex-end']} direction="column">
                    <Tooltip label="APR is averaged over the trailing 7 days and is comprised of both performance and rewards">
                      <Text
                        fontFamily="heading"
                        fontSize="sm"
                        lineHeight={5}
                        fontWeight="medium"
                        color="gray.500"
                      >
                        Estimated APR
                        <InfoIcon ml={1} mb="2px" w="10px" h="10px" />
                      </Text>
                    </Tooltip>
                    <Text fontWeight="bold" fontSize="20px" color="white" lineHeight="36px">
                      {pool && positionApr?.apr7d > 0
                        ? `${(positionApr.apr7d * 100).toFixed(2)?.concat('%')}`
                        : '-'}
                    </Text>
                  </Flex>
                )}
              </Flex>
              <Flex mt={6} flexDirection={['column', 'column', 'row']} gap={4}>
                <BorderBox
                  gap={4}
                  flex={1}
                  p={6}
                  flexDirection="column"
                  bg="navy.700"
                  height="fit-content"
                >
                  <ManageStats liquidityPosition={liquidityPosition} />
                  <Rewards />
                </BorderBox>
                {!closePosition ? (
                  <Flex
                    maxWidth={['100%', '100%', '501px']}
                    width="100%"
                    flex={1}
                    alignSelf="flex-start"
                    flexDirection="column"
                  >
                    <BorderBox
                      flex={1}
                      p={6}
                      flexDirection="column"
                      bg="navy.700"
                      height="fit-content"
                    >
                      <ManageAction
                        liquidityPosition={liquidityPosition}
                        setTxnModalOpen={setTxnModalOpen}
                        txnModalOpen={txnModalOpen}
                      />
                    </BorderBox>
                    {liquidityPosition?.collateralAmount.gt(0) && !txnModalOpen && (
                      <Text
                        textAlign="center"
                        cursor="pointer"
                        onClick={() => setClosePosition(true)}
                        color="cyan.500"
                        fontWeight={700}
                        mt="5"
                      >
                        Close Position
                      </Text>
                    )}
                  </Flex>
                ) : null}

                {closePosition ? (
                  <BorderBox
                    flex={1}
                    maxW={['100%', '100%', '501px']}
                    p={6}
                    flexDirection="column"
                    bg="navy.700"
                    height="fit-content"
                  >
                    <ClosePosition
                      liquidityPosition={liquidityPosition}
                      onClose={() => setClosePosition(false)}
                    />
                  </BorderBox>
                ) : null}
              </Flex>
            </Box>
          ) : null}
        </>
      ) : null}
    </ManagePositionProvider>
  );
};
