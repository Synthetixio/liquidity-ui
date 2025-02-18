import { ArrowUpIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Heading, Image, Link, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { getStatsUrl } from '@snx-v3/getStatsUrl';
import { LogoIcon } from '@snx-v3/icons';
import coinImage from '@snx-v3/Manage/coin.png';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { useVaultsData } from '@snx-v3/useVaultsData';
import { wei } from '@synthetixio/wei';
import numbro from 'numbro';
import React from 'react';
import { GradientCircle } from './GradientCircle';
import { LoanChart } from './LoanChart';
import { MigrationDialog } from './MigrationDialog';
import { useClosePositionNewPool } from './useClosePositionNewPool';
import { useLoanedAmount } from './useLoanedAmount';
import { usePositionCollateral } from './usePositionCollateral';

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
      color="gray.500"
      fontWeight="500"
      {...props}
    />
  );
}

export function NewPool() {
  const { network } = useNetwork();

  const { data: vaultsData, isPending: isPendingVaultsData } = useVaultsData(network);
  const { data: loanedAmount, isPending: isPendingLoanedAmount } = useLoanedAmount();

  const { data: collateralType } = useCollateralType('SNX');

  const vaultData = React.useMemo(() => {
    if (vaultsData && collateralType) {
      return vaultsData.find(
        (item) => item.collateralType.address.toLowerCase() === collateralType.address.toLowerCase()
      );
    }
  }, [collateralType, vaultsData]);

  const { data: positionCollateral, isPending: isPendingPositionCollateral } =
    usePositionCollateral();

  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');

  const [isOpenMigrate, setIsOpenMigrate] = React.useState(false);

  const { isReady: isReadyClosePosition, mutation: closePosition } = useClosePositionNewPool();

  return (
    <>
      <MigrationDialog onClose={() => setIsOpenMigrate(false)} isOpen={isOpenMigrate} />

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
              <Text>SNX Jubilee</Text>
            </Heading>

            <Flex direction="row" flexWrap="wrap" alignItems="center" gap={2}>
              <InfoBox>
                <NetworkIcon size="14px" networkId={network?.id} />
                <Text>{network?.label} Network</Text>
              </InfoBox>

              <InfoBox>
                <Text>TVL</Text>
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
          <Text mt={3} color="gray.500">
            Deposit your SNX to earn a share of the protocol’s revenue
          </Text>
        </Box>

        <Flex
          direction={['column', 'row', 'row']}
          flexWrap="wrap"
          alignItems="top"
          justifyContent="stretch"
          gap={4}
        >
          <Flex flex={[1, 1, 2]} direction="row" flexWrap="wrap" gap={6}>
            <Flex minWidth="120px" direction="column" gap={3}>
              <Text color="gray.500">Deposited</Text>
              <Text color="gray.50" fontSize="1.25em">
                {isPendingPositionCollateral || isPendingSnxPrice ? '~' : null}
                {!(isPendingPositionCollateral || isPendingSnxPrice) &&
                positionCollateral &&
                snxPrice ? (
                  <Amount prefix="$" value={wei(positionCollateral).mul(snxPrice)} />
                ) : null}
              </Text>
              <Button
                width="100%"
                isLoading={closePosition.isPending}
                isDisabled={!(isReadyClosePosition && !closePosition.isPending)}
                onClick={() => closePosition.mutateAsync()}
              >
                Withdraw
              </Button>
            </Flex>
          </Flex>
        </Flex>

        <Flex
          direction={{ base: 'column', sm: 'row', lg: 'row', xl: 'row' }}
          flexWrap="wrap"
          gap={4}
        >
          <Flex
            order={{ base: 2, sm: 1, lg: 1, xl: 1 }}
            flex={{ base: 1, sm: 2, lg: 2, xl: 2 }}
            width="100%"
            borderColor="gray.900"
            borderWidth="1px"
            borderRadius="5px"
            bg="navy.900"
            p={6}
            direction="column"
            gap={6}
          >
            <Flex direction="row" gap={6}>
              <Flex
                flex={{ base: 1, sm: 1, lg: 1, xl: 1 }}
                direction="column"
                width="200px"
                gap={6}
              >
                <Heading fontSize="20px" lineHeight="1.75rem" color="gray.50" fontWeight={700}>
                  Yield
                </Heading>
              </Flex>
            </Flex>
            <Flex gap={6} direction={{ base: 'column', sm: 'column', lg: 'row', xl: 'row' }}>
              <Flex
                flex={{ base: 1, sm: 1, lg: 1, xl: 1 }}
                direction="column"
                width="200px"
                gap={6}
                justifyContent="center"
              >
                <GradientCircle />
              </Flex>
              <Flex
                flex={{ base: 1, sm: 2, lg: 2, xl: 2 }}
                direction="column"
                minWidth="400px"
                gap={6}
                p={3}
              >
                <Flex minWidth="120px" direction="column" gap={3}>
                  <Text color="gray.500">Loan repaid</Text>
                  <Box>
                    <Text as="span" color="gray.50" fontSize="1.25em">
                      <Amount prefix="$" value={wei(0)} />
                    </Text>
                    <Text as="span" color="gray.500" fontSize="1.25em">
                      {isPendingLoanedAmount || isPendingSnxPrice ? '~' : null}
                      {!(isPendingLoanedAmount || isPendingSnxPrice) && loanedAmount ? (
                        <Amount prefix=" / $" value={wei(loanedAmount)} />
                      ) : null}
                    </Text>
                  </Box>
                </Flex>
                <Box>
                  <LoanChart />
                </Box>
              </Flex>
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
              <Image rounded="8px" src={coinImage} width="100%" maxWidth="354px" />
              <Heading fontSize="20px" lineHeight="1.75rem" color="gray.50" fontWeight={700}>
                Debt Jubilee
              </Heading>
            </Flex>
            <Button onClick={() => setIsOpenMigrate(true)}>Migrate to Jubilee</Button>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
