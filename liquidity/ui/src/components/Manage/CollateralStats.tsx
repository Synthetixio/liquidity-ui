import { Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { ONEWEI, ZEROWEI } from '@snx-v3/constants';
import { currency } from '@snx-v3/format';
import { CollateralType } from '@snx-v3/useCollateralTypes';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import Wei from '@synthetixio/wei';
import { ChangeStat } from '../ChangeStat';

export function CollateralStats({
  liquidityPosition,
  collateralType,
  newCollateralAmount,
  hasChanges,
  stataUSDCRate,
}: {
  liquidityPosition?: LiquidityPosition;
  collateralType?: CollateralType;
  newCollateralAmount: Wei;
  collateralValue: Wei;
  stataUSDCRate?: Wei;
  hasChanges: boolean;
}) {
  return (
    <BorderBox p={4} flex="1" flexDirection="row" bg="navy.700">
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
        <Flex width="100%">
          {liquidityPosition && collateralType ? (
            <Flex direction="column">
              <ChangeStat
                value={liquidityPosition.collateralAmount}
                newValue={newCollateralAmount}
                formatFn={(val: Wei) => {
                  if (collateralType.displaySymbol === 'stataUSDC') {
                    return `${currency(new Wei(val, 27).div(stataUSDCRate || ONEWEI))}`;
                  }
                  return `${currency(val)} ${collateralType.displaySymbol}`;
                }}
                hasChanges={hasChanges}
                data-cy="manage stats collateral"
              />
              <ChangeStat
                value={liquidityPosition.collateralAmount.mul(liquidityPosition.collateralPrice)}
                newValue={newCollateralAmount.mul(liquidityPosition.collateralPrice)}
                formatFn={(val: Wei) =>
                  currency(val, {
                    currency: 'USD',
                    style: 'currency',
                  })
                }
                size="md"
                hasChanges={hasChanges}
                data-cy="manage stats collateral value"
              />
            </Flex>
          ) : null}

          {!(liquidityPosition && collateralType) ? (
            <Flex direction="column">
              <ChangeStat
                value={ZEROWEI}
                newValue={newCollateralAmount}
                formatFn={(val: Wei) =>
                  `${currency(val)} ${
                    collateralType?.displaySymbol === 'stataUSDC'
                      ? 'USDC'
                      : collateralType?.displaySymbol || ''
                  }`
                }
                hasChanges={hasChanges}
              />
              <Text fontWeight="400" color="white" fontSize="16px">
                {currency(ZEROWEI, {
                  currency: 'USD',
                  style: 'currency',
                })}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </BorderBox>
  );
}
