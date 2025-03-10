import { Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { calculateCRatio } from '@snx-v3/calculations';
import { ZEROWEI } from '@snx-v3/constants';
import Wei from '@synthetixio/wei';
import { FC } from 'react';

export const CRatioChangeStat: FC<{
  collateralChange: Wei;
  currentCollateral?: Wei;
  debtChange: Wei;
  currentDebt?: Wei;
  size?: 'sm' | 'lg';
  collateralPrice?: Wei;
}> = ({ size, currentCollateral, currentDebt, collateralChange, debtChange, collateralPrice }) => (
  <Flex alignItems="center" gap={1.5}>
    <Text
      color="white"
      fontSize={size === 'lg' ? '20px' : '12px'}
      fontWeight={size === 'lg' ? '800' : '700'}
    >
      {!currentCollateral || !currentDebt || !collateralPrice ? (
        ' N/A'
      ) : currentCollateral.gt(0) && currentDebt.eq(0) ? (
        'Infinite'
      ) : (
        <Amount
          value={calculateCRatio(currentDebt, currentCollateral.mul(collateralPrice)).mul(100)}
          suffix="%"
        />
      )}
    </Text>

    {collateralPrice && (!collateralChange?.eq(0) || !debtChange.eq(0)) ? (
      <>
        <span>&rarr;</span>

        <Text
          color="white"
          fontSize={size === 'lg' ? '20px' : '12px'}
          fontWeight={size === 'lg' ? '800' : '700'}
        >
          {(currentCollateral || ZEROWEI).add(collateralChange).gt(0) &&
          (currentDebt || ZEROWEI).add(debtChange).eq(0) ? (
            'Infinite'
          ) : (
            <Amount
              value={calculateCRatio(
                (currentDebt || ZEROWEI).add(debtChange),
                (currentCollateral || ZEROWEI).add(collateralChange).mul(collateralPrice)
              ).mul(100)}
              suffix="%"
            />
          )}
        </Text>
      </>
    ) : null}
  </Flex>
);
