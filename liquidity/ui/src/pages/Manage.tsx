import { InfoIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { formatApr } from '@snx-v3/formatters';
import { ManagePositionProvider } from '@snx-v3/ManagePositionContext';
import { Tooltip } from '@snx-v3/Tooltip';
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type ManageActionType, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePool } from '@snx-v3/usePoolsList';
import React from 'react';
import { ClosePosition } from '../components/ClosePosition/ClosePosition';
import { UnsupportedCollateralAlert } from '../components/CollateralAlert/UnsupportedCollateralAlert';
import { ManageAction } from '../components/Manage/ManageActions';
import { ManageStats } from '../components/Manage/ManageStats';
import { PositionTitle } from '../components/Manage/PositionTitle';
import { StataDepositBanner } from '../components/Manage/StataDepositBanner';
import { LockedCollateral } from '../components/Positions/LockedCollateral';

export const Manage = () => {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  const { network } = useNetwork();

  const { data: collateralType, isPending: isPendingCollateralType } = useCollateralType(
    params.collateralSymbol
  );
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: stataUSDCAPR } = useStataUSDCApr(network?.id, network?.preset);
  const stataUSDCAPRParsed = stataUSDCAPR || 0;

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  const [txnModalOpen, setTxnModalOpen] = React.useState<ManageActionType | undefined>(undefined);

  const { data: pool, isPending: isPendingPool } = usePool(Number(network?.id));

  const positionApr = pool?.apr?.collateralAprs?.find(
    (item: any) => item.collateralType.toLowerCase() === collateralType?.tokenAddress.toLowerCase()
  );

  return (
    <ManagePositionProvider>
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
              {isPendingPool
                ? '~'
                : formatApr(
                    positionApr?.apr7d > 0
                      ? positionApr.apr7d * 100 + (isStataUSDC ? stataUSDCAPRParsed : 0)
                      : undefined
                  )}
            </Text>
          </Flex>
        </Flex>
        <Flex mt={6} flexDirection={['column', 'column', 'row']} gap={4}>
          <Flex flex={1} direction="column" gap={6}>
            <BorderBox gap={4} p={6} flexDirection="column" bg="navy.700">
              <ManageStats />
            </BorderBox>
            {isStataUSDC && liquidityPosition && liquidityPosition.collateralAmount.eq(0) && (
              <StataDepositBanner />
            )}
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
