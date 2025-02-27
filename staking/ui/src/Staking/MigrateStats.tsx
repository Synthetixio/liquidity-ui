import { Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { CRatioAmount } from '@snx-v3/CRatioBar';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { Wei, wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import React from 'react';

export function MigrateStats({
  collateralAmount,
  debt,
  cRatio,
}: {
  collateralAmount?: ethers.BigNumber | Wei;
  debt?: ethers.BigNumber | Wei;
  cRatio?: ethers.BigNumber | Wei;
}) {
  const { data: snxPrice } = usePythPrice('SNX');

  return (
    <Flex direction="column" gap={6}>
      <Text>Unmigrated Staked Balance</Text>
      <Flex gap={6} justifyContent="space-between">
        <Flex direction="column" gap={3} flex={1}>
          <Text color="gray.600" fontFamily="heading" fontSize="12px" lineHeight="16px" mr={1}>
            Deposited
          </Text>
          {collateralAmount ? (
            <Amount value={wei(collateralAmount)} suffix=" SNX" />
          ) : (
            <Text>~</Text>
          )}
          {snxPrice && collateralAmount ? (
            <Amount
              prefix="$"
              value={wei(collateralAmount).mul(snxPrice)}
              as={Text}
              color="gray.500"
              fontFamily="heading"
              fontSize="0.75rem"
              lineHeight="1rem"
            />
          ) : (
            <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
              ~
            </Text>
          )}
        </Flex>
        <Flex direction="column" gap={3} flex={1}>
          <Text color="gray.600" fontFamily="heading" fontSize="12px" lineHeight="16px" mr={1}>
            Loan
          </Text>
          {debt ? <Amount prefix="🔥 $" value={wei(debt)} /> : <Text>~</Text>}
        </Flex>
        <Flex direction="column" gap={3} flex={1}>
          <Text color="gray.600" fontFamily="heading" fontSize="12px" lineHeight="16px" mr={1}>
            C-Ratio
          </Text>
          {cRatio ? <CRatioAmount value={wei(cRatio).toNumber() * 100} /> : <Text>~</Text>}
        </Flex>
      </Flex>
    </Flex>
  );
}
