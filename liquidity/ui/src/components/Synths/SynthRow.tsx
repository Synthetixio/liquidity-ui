import { Fade, Flex, Td, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import Wei from '@synthetixio/wei';
import React from 'react';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export function SynthRow({
  symbol,
  name,
  synthBalance,
  tokenBalance,
}: {
  symbol: string;
  name: string;
  synthBalance: Wei;
  tokenBalance: Wei;
}) {
  return (
    <>
      <Td border="none">
        <Fade in>
          <Flex alignItems="center" textDecoration="none" _hover={{ textDecoration: 'none' }}>
            <TokenIcon height={30} width={30} symbol={symbol} />
            <Flex flexDirection="column" ml={3}>
              <Text
                color="white"
                fontWeight={700}
                lineHeight="1.25rem"
                fontFamily="heading"
                fontSize="sm"
              >
                {symbol}
              </Text>
              <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
                {name}
              </Text>
            </Flex>
          </Flex>
        </Fade>
      </Td>
      <Td border="none">
        <Fade in>
          <Text
            color={synthBalance.gt(0) ? 'green.500' : 'gray.50'}
            fontSize="14px"
            fontFamily="heading"
            fontWeight={500}
            lineHeight="20px"
          >
            <Amount value={synthBalance} showTooltip />
          </Text>
        </Fade>
      </Td>
      <Td border="none">
        <Fade in>
          <Text
            color="gray.50"
            fontSize="14px"
            fontFamily="heading"
            fontWeight={500}
            lineHeight="20px"
          >
            <Amount value={tokenBalance} showTooltip />
          </Text>
        </Fade>
      </Td>
    </>
  );
}
