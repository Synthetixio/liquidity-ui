import { InfoIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { getWrappedStataUSDCOnBase } from '@snx-v3/isBaseAndromeda';
import { ManagePositionProvider } from '@snx-v3/ManagePositionContext';
import { Tooltip } from '@snx-v3/Tooltip';
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType, useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type ManageActionType, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePoolData } from '@snx-v3/usePoolData';
import { usePool } from '@snx-v3/usePoolsList';
import { useState } from 'react';
import { ClosePosition } from '../components/ClosePosition/ClosePosition';
import { UnsupportedCollateralAlert } from '../components/CollateralAlert/UnsupportedCollateralAlert';
import { ManageAction } from '../components/Manage/ManageActions';
import { ManageStats } from '../components/Manage/ManageStats';
import { PositionTitle } from '../components/Manage/PositionTitle';
import { Rewards } from '../components/Rewards/Rewards';

export const Manage = () => {
  const [params] = useParams<PositionPageSchemaType>();
  const { network } = useNetwork();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: poolData } = usePoolData(params.poolId);

  const { data: liquidityPosition } = useLiquidityPosition({
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
  const collateralSymbol = collateralType?.symbol;

  const [closePosition, setClosePosition] = useState(false);

  const { data: stataUSDCAPR } = useStataUSDCApr(network?.id, network?.preset);
  const stataUSDCAPRParsed = stataUSDCAPR || 0;
  const isStataUSDC = getWrappedStataUSDCOnBase(network?.id) === collateralType?.tokenAddress;

  const [txnModalOpen, setTxnModalOpen] = useState<ManageActionType | undefined>(undefined);

  const { data: pool } = usePool(Number(network?.id), String(params.poolId));

  const positionApr = pool?.apr?.collateralAprs?.find(
    (item: any) => item.collateralType.toLowerCase() === collateralType?.tokenAddress.toLowerCase()
  );

  return (
    <ManagePositionProvider>
      <UnsupportedCollateralAlert isOpen={Boolean(notSupported)} />
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
    </ManagePositionProvider>
  );
};
