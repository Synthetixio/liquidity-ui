import { Flex, Heading, Table, TableContainer, Tbody, Text, Tr } from '@chakra-ui/react';
import { POOL_ID } from '@snx-v3/constants';
import { useApr } from '@snx-v3/useApr';
import { NetworkIcon, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import React from 'react';
import { PositionsEmpty } from './PositionEmpty';
import { PositionsNotConnected } from './PositionNotConnected';
import { PositionRow } from './PositionsRow';
import { PositionsRowLoading } from './PositionsRowLoading';
import { PositionTableHeader } from './PositionTableHeader';
import { TableDivider } from './TableDivider';

export const PositionsList = () => {
  const [params] = useParams();
  const { network } = useNetwork();
  const { activeWallet } = useWallet();
  const walletAddress = activeWallet?.address;

  const { data: liquidityPositions, isPending: isPendingLiquidityPositions } =
    useLiquidityPositions({ accountId: params.accountId });
  const { data: apr } = useApr();

  const filteredLiquidityPositions = React.useMemo(
    () =>
      liquidityPositions
        ? liquidityPositions.filter((liquidityPosition) => {
            if (liquidityPosition.collateralAmount.gt(0)) {
              // there is some amount delegated
              return true;
            }

            if (liquidityPosition.availableCollateral.gt(0)) {
              // there is some amount deposited and available to withdraw
              return true;
            }

            if (
              network?.preset === 'andromeda' &&
              liquidityPosition.collateralType.displaySymbol === 'USDC' &&
              liquidityPosition.availableSystemToken.gt(0)
            ) {
              // special case for USDC on Andromeda to allow withdrawals of snxUSD
              return true;
            }

            return false;
          })
        : [],
    [liquidityPositions, network?.preset]
  );

  return (
    <TableContainer
      maxW="100%"
      borderColor="gray.900"
      borderWidth="1px"
      borderRadius="5px"
      p={6}
      sx={{
        borderCollapse: 'separate !important',
        borderSpacing: 0,
      }}
      bg="navy.700"
    >
      {!walletAddress ? <PositionsNotConnected /> : null}
      {(walletAddress && !params.accountId) ||
      (!isPendingLiquidityPositions && !filteredLiquidityPositions.length) ? (
        <PositionsEmpty />
      ) : null}
      {params.accountId &&
      (isPendingLiquidityPositions || filteredLiquidityPositions.length > 0) ? (
        <>
          <Heading
            as={Flex}
            alignItems="center"
            gap={2}
            fontSize="18px"
            fontWeight={700}
            lineHeight="28px"
            color="gray.50"
            mb={3}
          >
            {network ? (
              <>
                <NetworkIcon size="24px" networkId={network.id} mr={1} />
                <Text>{network.label} Network</Text>
              </>
            ) : null}
          </Heading>

          <Table variant="simple">
            <PositionTableHeader />
            <Tbody>
              <TableDivider />
              {isPendingLiquidityPositions ? (
                <PositionsRowLoading />
              ) : (
                <>
                  {filteredLiquidityPositions?.map((liquidityPosition, i) => {
                    const positionApr = apr?.collateralAprs?.find(
                      (apr: { collateralType: string }) =>
                        apr.collateralType.toLowerCase() ===
                        liquidityPosition.collateralType.tokenAddress.toLowerCase()
                    );

                    return (
                      <Tr
                        key={`${POOL_ID}-${liquidityPosition.collateralType.tokenAddress}`}
                        borderBottomWidth={
                          i === filteredLiquidityPositions.length - 1 ? 'none' : '1px'
                        }
                      >
                        <PositionRow
                          liquidityPosition={liquidityPosition}
                          apr={positionApr?.apr7d * 100}
                        />
                      </Tr>
                    );
                  })}
                </>
              )}
            </Tbody>
          </Table>
        </>
      ) : null}
    </TableContainer>
  );
};
