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
import { usePythPrice } from '@snx-v3/usePythPrice';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import React from 'react';
import { LayoutWithImage } from './LayoutWithImage';
import { MigrateStats } from './MigrateStats';
import { Step0Intro } from './Step0Intro';
import { Step2SummaryV2x } from './Step2SummaryV2x';
import { Step3Success } from './Step3Success';
import { SubheaderMigrateAndEarn } from './SubheaderMigrateAndEarn';
import { useMigrateNewPoolV2x } from './useMigrateNewPoolV2x';
import { useV2xPosition } from './useV2xPosition';
import burn from './burn.webp';

export function MigrateFromV2x() {
  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');
  const [isOpenMigrate, setIsOpenMigrate] = React.useState(false);

  const { isReady: isReadyMigrate } = useMigrateNewPoolV2x();

  const { data: v2xPosition, isPending: isPendingV2xPosition } = useV2xPosition();

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
              <Step2SummaryV2x
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
              isPendingV2xPosition || isPendingSnxPrice
                ? '~'
                : v2xPosition && v2xPosition.collateralAmount.gt(0) && snxPrice
                  ? `${wei(v2xPosition.debt)
                      .div(wei(v2xPosition.collateralAmount).mul(snxPrice))
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
              debt={v2xPosition?.debt}
              collateralAmount={v2xPosition?.collateralAmount}
              cRatio={v2xPosition?.cRatio}
            />
            <Button isDisabled={!isReadyMigrate} onClick={() => setIsOpenMigrate(true)}>
              Burn My Debt
            </Button>
          </>
        )}
      />
    </>
  );
}
