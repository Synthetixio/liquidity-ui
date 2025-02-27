import {
  Button,
  CloseButton,
  Divider,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import React from 'react';
import { LayoutWithImage } from './LayoutWithImage';
import { MigrateStats } from './MigrateStats';
import { Step0Intro } from './Step0Intro';
import { Step2Summary } from './Step2Summary';
import { Step3Success } from './Step3Success';
import { SubheaderMigrateAndEarn } from './SubheaderMigrateAndEarn';
import { useMigrateNewPool } from './useMigrateNewPool';
import burn from './burn.webp';

export function MigrateFromV3() {
  const { data: collateralType } = useCollateralType('SNX');
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

      <LayoutWithImage
        imageSrc={burn}
        Subheader={() => (
          <SubheaderMigrateAndEarn
            apy={
              isPendingLiquidityPosition || isPendingSnxPrice
                ? '~'
                : liquidityPosition && liquidityPosition.collateralAmount.gt(0) && snxPrice
                  ? `${wei(liquidityPosition.debt)
                      .div(wei(liquidityPosition.collateralAmount).mul(snxPrice))
                      .mul(100)
                      .toNumber()
                      .toFixed(1)}%+`
                  : '-'
            }
          />
        )}
        Content={() => (
          <>
            <MigrateStats
              debt={liquidityPosition?.debt}
              collateralAmount={liquidityPosition?.collateralAmount}
              cRatio={liquidityPosition?.cRatio}
            />
            <Button mt={6} isDisabled={!isReadyMigrate} onClick={() => setIsOpenMigrate(true)}>
              Migrate to Jubilee
            </Button>
          </>
        )}
      />
    </>
  );
}
