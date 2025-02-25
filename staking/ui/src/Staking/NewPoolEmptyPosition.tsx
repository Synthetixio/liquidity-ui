import { ArrowUpIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Heading, Image, Link, Text } from '@chakra-ui/react';
import { getStatsUrl } from '@snx-v3/getStatsUrl';
import { LogoIcon } from '@snx-v3/icons';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { useVaultsData } from '@snx-v3/useVaultsData';
import numbro from 'numbro';
import React from 'react';
import CoinImage from './coin.webp';
import { InfoBox } from './InfoBox';

export function NewPoolEmptyPosition() {
  const { network } = useNetwork();

  const { data: collateralType } = useCollateralType('SNX');
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
    <Flex
      direction="column"
      borderColor="gray.900"
      borderWidth="1px"
      borderRadius="5px"
      bg="navy.700"
      p={6}
      gap={9}
    >
      <Box>
        <Flex direction="row" flexWrap="wrap" justifyContent="space-between" alignItems="center">
          <Heading
            as={Flex}
            alignItems="center"
            gap={4}
            fontSize="20px"
            lineHeight="1.75rem"
            color="gray.50"
            fontWeight={700}
          >
            <LogoIcon />
            <Text>SNX Debt Jubilee</Text>
          </Heading>

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
        </Flex>
        <Text mt={3} color="gray.500" fontSize="2em" maxWidth="20em">
          Debt-free staking starts now. Migrate & earn up to{' '}
          <Text as="span" fontWeight="700" color="green.500">
            20%+
          </Text>{' '}
          APR in debt forgiveness
        </Text>
      </Box>

      <Flex direction={{ base: 'column', sm: 'row', lg: 'row', xl: 'row' }} flexWrap="wrap" gap={4}>
        <Flex
          order={{ base: 2, sm: 1, lg: 1, xl: 1 }}
          flex={{ base: 1, sm: 2, lg: 2, xl: 2 }}
          width="100%"
          borderColor="gray.900"
          borderWidth="1px"
          borderRadius="5px"
          p={6}
          direction="column"
          gap={2}
        >
          <Text fontSize="1.25em">Looks like you don’t have an active staking position</Text>
          <Text mt={3} color="gray.600">
            Stake SNX on either Mainnet or Optimism at up to 500% C-Ratio and then come back to
            migrate your position.
          </Text>
          <Button
            as={Link}
            isExternal
            href="https://staking.synthetix.io"
            variant="outline"
            mt={3}
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Text>Stake on Mainnet</Text>
            <ArrowUpIcon transform="rotate(45deg)" />
          </Button>

          <Button
            as={Link}
            isExternal
            href="https://staking.synthetix.io"
            variant="outline"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Text>Stake on Optimism</Text>
            <ArrowUpIcon transform="rotate(45deg)" />
          </Button>
          {/*
          <Button variant="trasparent" borderColor="gray.900" borderWidth="1px">
            Get SNX
          </Button>
          */}

          <Flex
            mt={6}
            direction="row"
            borderColor="gray.900"
            borderWidth="1px"
            borderRadius="5px"
            p={2}
            gap={3}
            fontSize="0.75em"
            color="gray.600"
          >
            <Text px="1" backgroundColor="gray.900" textTransform="uppercase" fontWeight="bold">
              Coming soon
            </Text>
            <Text>Stake directly into the new pool</Text>
          </Flex>
        </Flex>
        <Flex
          order={{ base: 1, sm: 1, lg: 1, xl: 1 }}
          flex={{ base: 1, sm: 1, lg: 1, xl: 1 }}
          width="100%"
          direction="column"
          borderColor="gray.900"
          borderWidth="1px"
          borderRadius="5px"
          p={3}
          gap={3}
          justifyContent="space-between"
        >
          <Flex direction="column" gap={3}>
            <Image
              rounded="8px"
              src={CoinImage}
              width="100%"
              maxWidth="354px"
              style={{
                maskImage: 'linear-gradient(270deg, #000000 50%, rgba(0, 0, 0, 0) 100%)',
              }}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
