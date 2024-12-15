import { Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { currency } from '@snx-v3/format';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import Wei from '@synthetixio/wei';
import { ChangeStat } from '../ChangeStat/ChangeStat';

export function CollateralStats({
  newCollateralAmount,
  hasChanges,
}: {
  newCollateralAmount: Wei;
  hasChanges: boolean;
}) {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  return (
    <BorderBox maxW={['100%', '50%']} p={4} flex="1" flexDirection="row" bg="navy.700">
      <Flex
        opacity={!liquidityPosition && !hasChanges ? '40%' : '100%'}
        flexDirection="column"
        width="100%"
      >
        <Flex alignItems="center" mb="4px">
          <Text color="gray.500" fontSize="xs" fontFamily="heading" lineHeight="16px">
            Collateral
          </Text>
        </Flex>
        <Flex width="100%" isTruncated>
          {!isPendingLiquidityPosition && liquidityPosition && collateralType ? (
            <Flex width="100%" direction="column" gap="1">
              <ChangeStat
                value={liquidityPosition.collateralAmount}
                newValue={newCollateralAmount}
                formatFn={(val: Wei) => `${currency(val)} ${collateralType.displaySymbol}`}
                hasChanges={hasChanges}
                data-cy="stats collateral"
              />
              <ChangeStat
                value={liquidityPosition.collateralAmount.mul(liquidityPosition.collateralPrice)}
                newValue={newCollateralAmount.mul(liquidityPosition.collateralPrice)}
                formatFn={(val: Wei) => currency(val, { currency: 'USD', style: 'currency' })}
                size="md"
                hasChanges={hasChanges}
                data-cy="stats collateral value"
              />
            </Flex>
          ) : null}

          {isPendingLiquidityPosition ? (
            <Flex direction="column">
              <ChangeStat
                newValue={newCollateralAmount}
                formatFn={() => null}
                hasChanges={hasChanges}
                isPending={isPendingLiquidityPosition}
              />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </BorderBox>
  );
}
