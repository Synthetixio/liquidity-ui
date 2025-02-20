import {
  CloseButton,
  Divider,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import React from 'react';
import { Step0Intro } from './Step0Intro';
import { Step2Summary } from './Step2Summary';
import { Step3Success } from './Step3Success';
import { ethers } from 'ethers';

export function MigrationDialog({ onClose, isOpen }: { onClose: () => void; isOpen: boolean }) {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    if (!isOpen) {
      setStep(0);
    }
  }, [isOpen]);
  const [receipt, setReceipt] = React.useState<ethers.providers.TransactionReceipt>();

  return (
    <Modal size="lg" isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent mt="100px" borderWidth="1px" borderColor="gray.900" bg="navy.900" color="white">
        <Flex justifyContent="space-between" p={6} alignItems="center">
          <Heading fontSize="20px">Migrate to Delegated Staking</Heading>
          <CloseButton onClick={onClose} color="gray" />
        </Flex>
        <Flex width="100%" px={6}>
          <Divider borderColor="gray.900" mb={6} colorScheme="gray" />
        </Flex>
        <ModalBody pt={0} pb={6}>
          {step === 0 ? <Step0Intro onConfirm={() => setStep(2)} onClose={onClose} /> : null}
          {step === 2 ? (
            <Step2Summary
              onConfirm={(receipt: ethers.providers.TransactionReceipt) => {
                setReceipt(receipt);
                setStep(3);
              }}
              onClose={onClose}
            />
          ) : null}
          {step === 3 ? <Step3Success receipt={receipt} onConfirm={onClose} /> : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
