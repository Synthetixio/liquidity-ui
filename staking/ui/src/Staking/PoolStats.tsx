import { ArrowUpIcon } from '@chakra-ui/icons';
import { Flex, Link, Text } from '@chakra-ui/react';
import { getStatsUrl } from '@snx-v3/getStatsUrl';
import { MAINNET, NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { useVaultsData } from '@snx-v3/useVaultsData';
import numbro from 'numbro';
import React from 'react';
import { InfoBox } from './InfoBox';

export function PoolStats() {
  const { network = MAINNET } = useNetwork();
  const { data: collateralType } = useCollateralType('SNX', network);
  const { data: vaultsData, isPending: isPendingVaultsData } = useVaultsData(network);
  const vaultData = React.useMemo(() => {
    if (vaultsData && collateralType) {
      return vaultsData.find(
        (item) => item.collateralType.address.toLowerCase() === collateralType.address.toLowerCase()
      );
    }
  }, [collateralType, vaultsData]);
  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');

  return (
    <Flex direction="row" flexWrap="wrap" alignItems="center" gap={2}>
      <InfoBox>
        <NetworkIcon size="14px" networkId={network?.id} />
        <Text>{network?.label} Network</Text>
      </InfoBox>

      <InfoBox>
        <Text>TVL</Text>
        <Text color="gray.50">
          {isPendingVaultsData || isPendingSnxPrice
            ? '~'
            : vaultData && snxPrice
              ? numbro(vaultData.collateral.amount.mul(snxPrice).toNumber()).format({
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
