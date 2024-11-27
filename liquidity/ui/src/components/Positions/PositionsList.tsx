import { Flex, Heading } from '@chakra-ui/react';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { useApr } from '@snx-v3/useApr';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useLiquidityPositions } from '@snx-v3/useLiquidityPositions';
import { useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { calculatePositions } from '../../utils/positions';
import { PositionsTable } from './PositionsTable/PositionsTable';

export const PositionsList = () => {
  const params = useParams();
  const { network } = useNetwork();

  const { data: liquidityPositions, isPending: isPendingLiquidityPositions } =
    useLiquidityPositions({ accountId: params.accountId });

  const { data: apr } = useApr();
  const { data: systemToken, isPending: isPendingSystemToken } = useSystemToken();

  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const positions = calculatePositions(liquidityPositions, isBase);

  const parsedPositions = positions.filter(
    (position) => position.collateralAmount?.gt(0) || position.availableCollateral?.gt(0)
  );

  const isPending = isPendingLiquidityPositions || isPendingSystemToken;

  return (
    <Flex flexDir="column">
      <Heading fontSize="1.25rem" fontFamily="heading" lineHeight="1.75rem" mt={4}>
        Positions
      </Heading>
      <PositionsTable
        isLoading={Boolean(params.accountId && isPending)}
        positions={parsedPositions}
        apr={apr?.collateralAprs}
        systemToken={systemToken}
      />
    </Flex>
  );
};
