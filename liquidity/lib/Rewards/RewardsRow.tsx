import { Fade, Flex, Td, Text, Tr } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { TokenIcon } from '@snx-v3/TokenIcon';
import Wei from '@synthetixio/wei';
import React from 'react';

export function RewardsRow({
  displaySymbol,
  claimableAmount,
}: {
  displaySymbol: string;
  claimableAmount: Wei;
}) {
  return (
    <>
      <Tr>
        <Td display="flex" alignItems="center" px={4} py={3} border="none" w="100%">
          <Fade in>
            <TokenIcon height={30} width={30} symbol={displaySymbol} />
          </Fade>
          <Fade in>
            <Flex flexDirection="column" ml="12px">
              <Text
                color="gray.50"
                fontSize="14px"
                fontFamily="heading"
                fontWeight={500}
                lineHeight="20px"
              >
                {displaySymbol}
              </Text>
            </Flex>
          </Fade>
        </Td>
        <Td alignItems="center" px={4} py={3} border="none">
          <Fade in>
            <Text
              color="gray.50"
              fontSize="14px"
              fontFamily="heading"
              fontWeight={500}
              lineHeight="20px"
            >
              <Amount value={claimableAmount} />
            </Text>
          </Fade>
        </Td>
      </Tr>
    </>
  );
}
