import { InfoIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { ManagePositionProvider } from '@snx-v3/ManagePositionContext';
import { Tooltip } from '@snx-v3/Tooltip';
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type ManageActionType, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePoolData } from '@snx-v3/usePoolData';
import { usePool } from '@snx-v3/usePoolsList';
import React from 'react';
import { ClosePosition } from '../components/ClosePosition/ClosePosition';
import { UnsupportedCollateralAlert } from '../components/CollateralAlert/UnsupportedCollateralAlert';
import { ManageAction } from '../components/Manage/ManageActions';
import { ManageStats } from '../components/Manage/ManageStats';
import { PositionTitle } from '../components/Manage/PositionTitle';
import { Rewards } from '../components/Rewards/Rewards';

export const Manage = () => {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  const { network } = useNetwork();

  const { data: collateralType, error } = useCollateralType(params.collateralSymbol);
  // UnsupportedCollateralAlert
  const { data: poolData } = usePoolData(params.poolId);

  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const collateralSymbol = collateralType?.symbol;

  const { data: stataUSDCAPR } = useStataUSDCApr(network?.id, network?.preset);
  const stataUSDCAPRParsed = stataUSDCAPR || 0;

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  const [txnModalOpen, setTxnModalOpen] = React.useState<ManageActionType | undefined>(undefined);

  const { data: pool } = usePool(Number(network?.id), String(params.poolId));

  const positionApr = pool?.apr?.collateralAprs?.find(
    (item: any) => item.collateralType.toLowerCase() === collateralType?.tokenAddress.toLowerCase()
  );

  return (
    <ManagePositionProvider>
      <UnsupportedCollateralAlert
        isOpen={Boolean(error && error.message === 'Unsupported collateral')}
      />
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
                      poolId: params.poolId,
                      manageAction: 'deposit',
                      accountId: params.accountId,
                    })
                  }
                />
              </BorderBox>
            ) : null}

            {params.manageAction !== 'close' ? (
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
                        poolId: params.poolId,
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
