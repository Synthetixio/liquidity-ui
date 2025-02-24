import { ArrowUpIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  CloseButton,
  Divider,
  Flex,
  Heading,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { CRatioAmount } from '@snx-v3/CRatioBar';
import { getStatsUrl } from '@snx-v3/getStatsUrl';
import { LogoIcon } from '@snx-v3/icons';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { useVaultsData } from '@snx-v3/useVaultsData';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import numbro from 'numbro';
import React from 'react';
import CoinImage from './coin.webp';
import { Step0Intro } from './Step0Intro';
import { Step2Summary } from './Step2Summary';
import { Step3Success } from './Step3Success';
import { useMigrateNewPool } from './useMigrateNewPool';

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

export function NewPoolMigration() {
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
  const [isOpenMigrate, setIsOpenMigrate] = React.useState(false);

  const { isReady: isReadyMigrate } = useMigrateNewPool();

  const [params] = useParams<PositionPageSchemaType>();
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    if (!isOpenMigrate) {
      setStep(0);
    }
  }, [isOpenMigrate]);
  const [receipt, setReceipt] = React.useState<ethers.providers.TransactionReceipt>();

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpenMigrate}
        onClose={() => setIsOpenMigrate(false)}
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent
          mt="100px"
          borderWidth="1px"
          borderColor="gray.900"
          bg="navy.900"
          color="white"
        >
          <Flex justifyContent="space-between" p={6} alignItems="center">
            <Heading fontSize="20px">Migrate to Delegated Staking</Heading>
            <CloseButton onClick={() => setIsOpenMigrate(false)} color="gray" />
          </Flex>
          <Flex width="100%" px={6}>
            <Divider borderColor="gray.900" mb={6} colorScheme="gray" />
          </Flex>
          <ModalBody pt={0} pb={6}>
            {step === 0 ? (
              <Step0Intro onConfirm={() => setStep(2)} onClose={() => setIsOpenMigrate(false)} />
            ) : null}
            {step === 2 ? (
              <Step2Summary
                onConfirm={(receipt: ethers.providers.TransactionReceipt) => {
                  setReceipt(receipt);
                  setStep(3);
                }}
                onClose={() => setIsOpenMigrate(false)}
              />
            ) : null}
            {step === 3 ? (
              <Step3Success receipt={receipt} onConfirm={() => setIsOpenMigrate(false)} />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
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
              {isPendingLiquidityPosition || isPendingSnxPrice
                ? '~'
                : liquidityPosition && liquidityPosition.collateralAmount.gt(0) && snxPrice
                  ? `${wei(liquidityPosition.debt)
                      .div(wei(liquidityPosition.collateralAmount).mul(snxPrice))
                      .mul(100)
                      .toNumber()
                      .toFixed(1)}%+`
                  : '-'}
            </Text>{' '}
            APR in debt forgiveness
          </Text>
        </Box>

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
            <Text>Unmigrated Staked Balance</Text>
            {liquidityPosition && snxPrice ? (
              <Flex gap={6}>
                <Flex direction="column" gap={3}>
                  <Text>Deposited</Text>
                  <Amount value={wei(liquidityPosition.collateralAmount)} suffix=" SNX" />
                  <Amount
                    prefix="$"
                    value={wei(liquidityPosition.collateralAmount).mul(snxPrice)}
                  />
                </Flex>
                <Flex direction="column" gap={3}>
                  <Text>Loan</Text>
                  <Amount prefix="$" value={wei(liquidityPosition.debt)} />
                </Flex>
                <Flex direction="column" gap={3}>
                  <Text>C-Ratio</Text>
                  <CRatioAmount value={wei(liquidityPosition.cRatio).toNumber() * 100} />
                </Flex>
              </Flex>
            ) : null}

            <Button isDisabled={!isReadyMigrate} onClick={() => setIsOpenMigrate(true)}>
              Migrate to Jubilee
            </Button>
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
    </>
  );
}
