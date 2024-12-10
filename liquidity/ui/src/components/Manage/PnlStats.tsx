import { InfoIcon } from '@chakra-ui/icons';
import { Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { currency } from '@snx-v3/format';
import { Tooltip } from '@snx-v3/Tooltip';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { type Wei } from '@synthetixio/wei';
import { ChangeStat } from '../ChangeStat/ChangeStat';

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
            label="Your portion of the pool's total debt, which fluctuates based on trader performance and market conditions"
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
            isPending={isPendingLiquidityPosition}
            newValue={newDebt.mul(-1)}
            formatFn={(val: Wei) =>
              currency(val, {
                currency: 'USD',
                style: 'currency',
                maximumFractionDigits: 4,
              })
            }
            withColor
            hasChanges={hasChanges}
          />
        </Flex>
      </Flex>
    </BorderBox>
  );
}
