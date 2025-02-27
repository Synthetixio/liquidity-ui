import { Flex, Text } from '@chakra-ui/react';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { ButtonDocs } from './ButtonDocs';
import { ButtonGetSnx } from './ButtonGetSnx';
import { ButtonStake } from './ButtonStake';
import { ComingSoon } from './ComingSoon';
import { LayoutWithImage } from './LayoutWithImage';
import { SubheaderMigrateAndEarn } from './SubheaderMigrateAndEarn';
import burn from './burn.webp';

export function EmptyV3Debt() {
  return (
    <LayoutWithImage
      imageSrc={burn}
      Subheader={() => (
        <SubheaderMigrateAndEarn apy={`${wei(200).div(1000).mul(100).toNumber().toFixed(1)}%+`} />
      )}
      Content={() => (
        <>
          <Text fontSize="1.25em">Looks like you don’t have any debt outstanding</Text>
          <Text color="gray.600">
            Mint some debt and migrate now, or check back soon to take advantage of rewards for
            debt-free stakers!
          </Text>

          <ButtonStake />

          <Flex gap={4} justifyContent="space-between">
            <ButtonGetSnx />
            <ButtonDocs />
          </Flex>

          <ComingSoon mt={6} />
        </>
      )}
    />
  );
}
