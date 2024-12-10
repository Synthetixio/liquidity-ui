import { Flex, Heading } from '@chakra-ui/react';
import { useApr } from '@snx-v3/useApr';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import React from 'react';
import { PositionsTable } from './PositionsTable/PositionsTable';

export const PositionsList = () => {
  const [params] = useParams();
  const { network } = useNetwork();

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
            : []
        }
        apr={apr?.collateralAprs}
      />
    </Flex>
  );
};
