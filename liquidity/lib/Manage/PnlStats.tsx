import { InfoIcon } from '@chakra-ui/icons';
import { Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { ChangeStat } from '@snx-v3/ChangeStat';
import { PnlAmount } from '@snx-v3/DebtAmount';
import { Tooltip } from '@snx-v3/Tooltip';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { type Wei } from '@synthetixio/wei';

export function PnlStats({ newDebt, hasChanges }: { newDebt: Wei; hasChanges: boolean }) {
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  return (
    <BorderBox p={4} flex="1" flexDirection="row" bg="navy.700" justifyContent="space-between">
      <Flex flexDirection="column" width="100%">
        <Flex alignItems="center" mb="4px">
          <Text color="gray.500" fontSize="xs" fontFamily="heading" lineHeight="16px">
            PnL
          </Text>
          <Tooltip
            label="Your portion of the pool's total debt, which fluctuates based on trader performance and market conditions. This PNL is not inclusive liquidated trader collateral rewards."
            textAlign="start"
            py={2}
            px={3}
          >
            <Flex height="12px" width="12px" ml="4px" alignItems="center" justifyContent="center">
              <InfoIcon color="white" height="9px" width="9px" />
            </Flex>
          </Tooltip>
        </Flex>
        <Flex width="100%">
          <ChangeStat
            value={liquidityPosition?.debt.mul(-1)}
            isPending={Boolean(params.accountId && isPendingLiquidityPosition)}
            newValue={newDebt.mul(-1)}
            formatFn={(val?: Wei) => <PnlAmount debt={val ? val.mul(-1) : val} />}
            hasChanges={hasChanges}
            data-cy="stats pnl"
          />
        </Flex>
      </Flex>
    </BorderBox>
  );
}
