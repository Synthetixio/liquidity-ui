import { ArrowUpIcon } from '@chakra-ui/icons';
import { Flex, Heading, Link, Text } from '@chakra-ui/react';
import { formatNumberToUsd } from '@snx-v3/formatters';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useVaultsData } from '@snx-v3/useVaultsData';
import React from 'react';
import { TokenIcon } from '../TokenIcon/TokenIcon';
// import { useApr } from '@snx-v3/useApr';

function getStatsUrl(chainId?: number) {
  if (chainId === 1) {
    return 'https://stats.synthetix.io/all/?page=ethereum';
  }
  if (chainId === 10) {
    return 'https://stats.synthetix.io/all/?page=optimism';
  }
  if (chainId === 8453) {
    return 'https://stats.synthetix.io/all/?page=base';
  }
  if (chainId === 42161) {
    return 'https://stats.synthetix.io/all/?page=arbitrum';
  }
  return 'https://stats.synthetix.io/all/';
}

export function PositionTitle() {
  const { network } = useNetwork();

  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { data: vaultsData, isPending: isPendingVaultsData } = useVaultsData(network);

  // const { data: aprData, isPending: isAprLoading } = useApr(network);
  // const { collateral: totalCollateral, debt: totalDebt } = React.useMemo(() => {
  //   const zeroValues = { collateral: { value: wei(0), amount: wei(0) }, debt: wei(0) };
  //   if (!vaultsData) return zeroValues;
  //
  //   return vaultsData.reduce((acc, { collateral, debt }) => {
  //     acc.collateral = {
  //       value: acc.collateral.value.add(collateral.value),
  //       amount: acc.collateral.amount.add(collateral.amount),
  //     };
  //     acc.debt = acc.debt.add(debt);
  //     return acc;
  //   }, zeroValues);
  // }, [vaultsData]);

  const vaultData = React.useMemo(() => {
    if (vaultsData && collateralType) {
      return vaultsData.find(
        (item) => item.collateralType.address.toLowerCase() === collateralType.address.toLowerCase()
      );
    }
  }, [collateralType, vaultsData]);

  return (
    <Flex alignItems="center">
      <Flex
        bg="linear-gradient(180deg, #08021E 0%, #1F0777 100%)"
        justifyContent="center"
        alignItems="center"
        borderRadius="100%"
        display="flex"
      >
        <TokenIcon
          symbol={collateralType?.symbol ?? params.collateralSymbol}
          height={42}
          width={42}
          fill="#0B0B22"
          color="#00D1FF"
        />
      </Flex>
      <Flex direction="column" gap={0.5}>
        <Heading
          ml={4}
          fontWeight={700}
          fontSize={['18px', '20px', '24px']}
          color="gray.50"
          display="flex"
          alignItems="center"
        >
          {collateralType?.displaySymbol ?? params.collateralSymbol} Liquidity Position
        </Heading>
        <Flex
          ml={4}
          fontWeight={700}
          fontSize={['10px', '12px']}
          color="gray.50"
          alignItems="center"
          gap={3}
          lineHeight="14px"
        >
          <Flex
            mt={0.25}
            alignItems="center"
            color="gray.500"
            fontWeight="500"
            borderWidth={1}
            borderRadius={4}
            px={1}
            py={0.5}
            gap={2}
          >
            <NetworkIcon size="14px" networkId={network?.id} />
            <Text>{network?.label} Network</Text>
          </Flex>
          <Flex
            alignItems="center"
            color="gray.500"
            fontWeight="500"
            borderWidth={1}
            borderRadius={4}
            px={1}
            py={0.5}
            gap={2}
          >
            <Text>Total TVL</Text>
            <Text>
              {isPendingVaultsData
                ? '~'
                : vaultData
                  ? formatNumberToUsd(vaultData.collateral.value.toNumber(), {
                      maximumFractionDigits: 0,
                    })
                  : '-'}
            </Text>
          </Flex>
          <Flex
            as={Link}
            isExternal
            href={getStatsUrl(network?.id)}
            textDecoration="none"
            _hover={{ textDecoration: 'none' }}
            cursor="pointer"
            alignItems="center"
            color="gray.500"
            fontWeight="500"
            borderWidth={1}
            borderRadius={4}
            px={1}
            py={0.5}
            gap={2}
          >
            <Text>More Stats</Text>
            <ArrowUpIcon transform="rotate(45deg)" />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
