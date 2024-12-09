import { Flex, Heading } from '@chakra-ui/react';
import { useApr } from '@snx-v3/useApr';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import React from 'react';
import { PositionsTable } from './PositionsTable/PositionsTable';

export const PositionsList = () => {
  const [params] = useParams();

  const { data: liquidityPositions, isPending: isPendingLiquidityPositions } =
    useLiquidityPositions({ accountId: params.accountId });
  const { data: apr } = useApr();
  return (
    <Flex flexDir="column">
      <Heading fontSize="1.25rem" fontFamily="heading" lineHeight="1.75rem" mt={4}>
        Positions
      </Heading>
      <PositionsTable
        isLoading={Boolean(params.accountId && isPendingLiquidityPositions)}
        liquidityPositions={
          liquidityPositions
            ? liquidityPositions.filter(
                (liquidityPosition) =>
                  liquidityPosition.collateralAmount.gt(0) ||
                  liquidityPosition.availableCollateral.gt(0)
              )
            : []
        }
        apr={apr?.collateralAprs}
      />
    </Flex>
  );
};
