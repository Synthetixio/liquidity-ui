import { ArrowUpIcon } from '@chakra-ui/icons';
import { Flex, Link, Text } from '@chakra-ui/react';
import { getStatsUrl } from '@snx-v3/getStatsUrl';
import { MAINNET, useNetwork } from '@snx-v3/useBlockchain';
import numbro from 'numbro';
import React from 'react';
import { InfoBox } from './InfoBox';
import { useTvl } from './useTvl';

export function PoolStats() {
  const { network = MAINNET } = useNetwork();
  const { data: tvl, isPending: isPendingTvl } = useTvl();
  return (
    <Flex direction="row" flexWrap="wrap" alignItems="center" gap={2}>
      <InfoBox>
        <Text>TVL</Text>
        <Text color="gray.50">
          {isPendingTvl
            ? '~'
            : tvl
              ? numbro(tvl).format({
                  trimMantissa: true,
                  thousandSeparated: true,
                  average: true,
                  mantissa: 1,
                  spaceSeparated: true,
                })
              : '-'}
        </Text>
      </InfoBox>

      <InfoBox
        as={Link}
        isExternal
        href={getStatsUrl(network?.id)}
        textDecoration="none"
        _hover={{ textDecoration: 'none' }}
        cursor="pointer"
      >
        <Text>More Stats</Text>
        <ArrowUpIcon transform="rotate(45deg)" />
      </InfoBox>
    </Flex>
  );
}
