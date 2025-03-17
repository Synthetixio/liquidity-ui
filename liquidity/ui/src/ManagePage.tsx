import { InfoIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { ClosePosition } from '@snx-v3/ClosePosition';
import { UnsupportedCollateralAlert } from '@snx-v3/CollateralAlert';
import { ManageStats, PositionTitle, StataDepositBanner } from '@snx-v3/Manage';
import { ManageAction } from '@snx-v3/ManageAction';
import { ManagePositionProvider } from '@snx-v3/ManagePositionContext';
import { LockedCollateral } from '@snx-v3/Positions';
import { Tooltip } from '@snx-v3/Tooltip';
import { useApr } from '@snx-v3/useApr';
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useIsAndromedaStataUSDC } from '@snx-v3/useIsAndromedaStataUSDC';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type ManageActionType, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import React from 'react';
import { Helmet } from 'react-helmet';

export const ManagePage = () => {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  const { network } = useNetwork();

  const { data: collateralType, isPending: isPendingCollateralType } = useCollateralType(
    params.collateralSymbol
  );
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: stataUSDCApr } = useStataUSDCApr(network?.id, network?.preset);

  const isAndromedaStataUSDC = useIsAndromedaStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  const [txnModalOpen, setTxnModalOpen] = React.useState<ManageActionType | undefined>(undefined);

  const { data: apr, isPending: isPendingApr } = useApr(network);
  const positionApr = React.useMemo(
    () =>
      apr?.find(
        (item) => item.collateralType.toLowerCase() === collateralType?.tokenAddress.toLowerCase()
      ),
    [apr, collateralType?.tokenAddress]
  );

  return (
    <ManagePositionProvider>
      <Helmet>
        <title>
          {`Synthetix ${collateralType?.displaySymbol ?? params.collateralSymbol} Position`}
        </title>
        <meta
          name="description"
          content={`Synthetix Liquidity V3 - ${
            collateralType?.displaySymbol ?? params.collateralSymbol
          } Position`}
        />
      </Helmet>
      <UnsupportedCollateralAlert isOpen={!isPendingCollateralType && !collateralType} />
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
          <Flex alignItems={['center', 'flex-end']} direction="column">
            <Tooltip
              label={
                <Text textAlign="left">
                  Performance APR is calculated based on the last 28 days rolling average. <br />
                  Rewards APR is calculated based on the last 1 hour of any active incentive
                  program.
                  {isAndromedaStataUSDC && (
                    <>
                      <br />
                      Aave APR is the latest Aave lending rate.
                    </>
                  )}
                </Text>
              }
            >
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
              {isPendingApr ? '~' : null}

              {!isPendingApr && positionApr && positionApr.apr28d > 0
                ? (
                    positionApr.apr28dPerformance * 100 +
                    (isAndromedaStataUSDC && stataUSDCApr ? stataUSDCApr : 0) +
                    positionApr.apr24hIncentiveRewards * 100
                  )
                    .toFixed(2)
                    .concat('%')
                : '-'}
            </Text>
          </Flex>
        </Flex>
        <Flex mt={6} flexDirection={['column', 'column', 'row']} gap={4}>
          <Flex flex={1} direction="column" gap={6}>
            <BorderBox gap={4} p={6} flexDirection="column" bg="navy.700">
              <ManageStats />
            </BorderBox>
            {isAndromedaStataUSDC &&
              liquidityPosition &&
              liquidityPosition.collateralAmount.eq(0) && <StataDepositBanner />}
          </Flex>
          <Flex
            maxWidth={['100%', '100%', '501px']}
            width="100%"
            flex={1}
            alignSelf="flex-start"
            flexDirection="column"
          >
            {params.manageAction === 'close' ? (
              <BorderBox
                flex={1}
                maxW={['100%', '100%', '501px']}
                p={6}
                flexDirection="column"
                bg="navy.700"
                height="fit-content"
              >
                <ClosePosition
                  onClose={() =>
                    setParams({
                      page: 'position',
                      collateralSymbol: params.collateralSymbol,
                      manageAction: 'deposit',
                      accountId: params.accountId,
                    })
                  }
                />
              </BorderBox>
            ) : null}

            {params.manageAction === 'locked' ? (
              <BorderBox
                flex={1}
                maxW={['100%', '100%', '501px']}
                p={6}
                flexDirection="column"
                bg="navy.700"
                height="fit-content"
              >
                <LockedCollateral
                  onClose={() =>
                    setParams({
                      page: 'position',
                      collateralSymbol: params.collateralSymbol,
                      manageAction: 'deposit',
                      accountId: params.accountId,
                    })
                  }
                />
              </BorderBox>
            ) : null}

            {!['close', 'locked'].includes(params.manageAction) ? (
              <>
                <BorderBox flex={1} p={6} flexDirection="column" bg="navy.700" height="fit-content">
                  <ManageAction setTxnModalOpen={setTxnModalOpen} txnModalOpen={txnModalOpen} />
                </BorderBox>

                {!txnModalOpen && liquidityPosition?.collateralAmount.gt(0) ? (
                  <Text
                    textAlign="center"
                    cursor="pointer"
                    onClick={() =>
                      setParams({
                        page: 'position',
                        collateralSymbol: params.collateralSymbol,
                        manageAction: 'close',
                        accountId: params.accountId,
                      })
                    }
                    color="cyan.500"
                    fontWeight={700}
                    mt="5"
                    data-cy="close position"
                  >
                    Close Position
                  </Text>
                ) : null}
              </>
            ) : null}
          </Flex>
        </Flex>
      </Box>
    </ManagePositionProvider>
  );
};
