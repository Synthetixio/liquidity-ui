import { ArrowUpIcon } from '@chakra-ui/icons';
import { Flex, Heading, Link, Text } from '@chakra-ui/react';
import { getStatsUrl } from '@snx-v3/getStatsUrl';
import { LogoIcon } from '@snx-v3/icons';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useVaultsData } from '@snx-v3/useVaultsData';
import numbro from 'numbro';
import React from 'react';

function InfoBox({ ...props }) {
  return (
    <Flex
      alignItems="center"
      borderWidth={1}
      borderRadius={4}
      px={2}
      py={0}
      gap={2}
      height="1.75em"
      {...props}
    />
  );
}

export function SNXJubilee() {
  const { network } = useNetwork();
  const { data: vaultsData, isPending: isPendingVaultsData } = useVaultsData(network);

  const { data: collateralType } = useCollateralType('SNX');

  const vaultData = React.useMemo(() => {
    if (vaultsData && collateralType) {
      return vaultsData.find(
        (item) => item.collateralType.address.toLowerCase() === collateralType.address.toLowerCase()
      );
    }
  }, [collateralType, vaultsData]);

  return (
    <Flex direction="column">
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <Heading
          as={Flex}
          alignItems="center"
          gap={4}
          fontWeight={700}
          color="gray.50"
          mb={3}
          fontSize="1.25rem"
          fontFamily="heading"
          lineHeight="1.75rem"
        >
          <LogoIcon />
          <Text>SNX Jubilee</Text>
        </Heading>

        <Flex alignItems="center" gap={2} color="gray.500" fontWeight="500">
          <InfoBox>
            <NetworkIcon size="14px" networkId={network?.id} />
            <Text>{network?.label} Network</Text>
          </InfoBox>

          <InfoBox>
            <Text>Total TVL</Text>
            <Text color="gray.50">
              {isPendingVaultsData
                ? '~'
                : vaultData
                  ? numbro(vaultData.collateral.value.toNumber()).format({
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
      </Flex>
    </Flex>
  );
}
