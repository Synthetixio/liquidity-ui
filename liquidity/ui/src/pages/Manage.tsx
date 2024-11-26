import { InfoIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { getWrappedStataUSDCOnBase, isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionProvider } from '@snx-v3/ManagePositionContext';
import { Tooltip } from '@snx-v3/Tooltip';
import { Network, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { CollateralType, useCollateralType, useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { LiquidityPosition, useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { usePoolData } from '@snx-v3/usePoolData';
import { usePool } from '@snx-v3/usePoolsList';
import { FC, useMemo, useState } from 'react';
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
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';

export function useCollateralDisplayName(collateralSymbol?: string) {
  const { network } = useNetwork();

  return useMemo(() => {
    if (!network?.id && network?.preset) {
      return undefined;
    }

    if (!isBaseAndromeda(network?.id, network?.preset)) {
      return collateralSymbol;
    }

    if (collateralSymbol?.toLowerCase() === 'susdc') {
      return 'USDC';
    }

    return collateralSymbol;
  }, [network?.id, network?.preset, collateralSymbol]);
}

export const ManageUi: FC<{
  collateralType?: CollateralType;
  liquidityPosition?: LiquidityPosition;
  network?: Network;
  collateralSymbol?: string;
}> = ({ collateralType, liquidityPosition, network, collateralSymbol }) => {
  const { poolId } = useParams();

  const [closePosition, setClosePosition] = useState(false);

  const { data: poolData } = usePool(Number(network?.id), String(poolId));
  const { data: stataUSDCAPR } = useStataUSDCApr(network?.id, network?.preset);
  const stataUSDCAPRParsed = stataUSDCAPR || 0;
  const isStataUSDC = getWrappedStataUSDCOnBase(network?.id) === collateralType?.tokenAddress;

  const [txnModalOpen, setTxnModalOpen] = useState<ManageAction | undefined>(undefined);
  const positionApr = poolData?.apr?.collateralAprs?.find(
    (item: any) => item.collateralType.toLowerCase() === collateralType?.tokenAddress.toLowerCase()
  );

  return (
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
        <PositionTitle collateralSymbol={collateralSymbol} isOpen={false} />
        {poolData && (
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
              {poolData && positionApr?.apr7d > 0
                ? `${(positionApr.apr7d * 100 + (isStataUSDC ? stataUSDCAPRParsed : 0))
                    .toFixed(2)
                    ?.concat('%')}`
                : '-'}
            </Text>
          </Flex>
        )}
      </Flex>
      <Flex mt={6} flexDirection={['column', 'column', 'row']} gap={4}>
        <BorderBox gap={4} flex={1} p={6} flexDirection="column" bg="navy.700" height="fit-content">
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
            <BorderBox flex={1} p={6} flexDirection="column" bg="navy.700" height="fit-content">
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
                data-cy="close position"
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
  );
};

export const Manage = () => {
  const params = useParams();

  const { network } = useNetwork();
  const { activeWallet } = useWallet();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: poolData } = usePoolData(params.poolId);

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    tokenAddress: collateralType?.tokenAddress,
    accountId: params.accountId,
    poolId: params.poolId,
  });

  const collateralDisplayName = collateralType?.displaySymbol;
  const { data: collateralTypes, isPending: isPendingCollaterals } = useCollateralTypes();

  const notSupported =
    !isPendingCollaterals &&
    poolData &&
    collateralTypes?.length &&
    collateralDisplayName &&
    !collateralTypes.some((item) =>
      [item.symbol.toUpperCase(), item.displaySymbol.toUpperCase()].includes(
        collateralDisplayName.toUpperCase()
      )
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

          {!params.accountId && isPendingLiquidityPosition ? (
            <NoPosition liquidityPosition={liquidityPosition} />
          ) : null}

          {params.accountId && isPendingLiquidityPosition ? (
            <ManageLoading collateralSymbol={collateralType?.symbol} />
          ) : null}

          {params.accountId &&
          !isPendingLiquidityPosition &&
          !hasPosition &&
          !hasAvailableCollateral ? (
            <NoPosition liquidityPosition={liquidityPosition} />
          ) : null}

          {params.accountId &&
          !isPendingLiquidityPosition &&
          (hasPosition || hasAvailableCollateral) ? (
            <ManageUi
              liquidityPosition={liquidityPosition}
              network={network}
              collateralSymbol={collateralType?.symbol}
              collateralType={collateralType}
            />
          ) : null}
        </>
      ) : null}
    </ManagePositionProvider>
  );
};
