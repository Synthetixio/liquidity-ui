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
import { ZEROWEI } from '@snx-v3/constants';
import { Network } from '@snx-v3/useBlockchain';
import { useParams } from '@snx-v3/useParams';
import React from 'react';
import { StepSuccessFinal } from '../Migration/StepSuccessFinal';
import { MigrateUSDTransaction } from './MigrateUSDTransaction';
import { StepIntro } from './StepIntro';
import { type HomePageSchemaType } from '@snx-v3/useParams';

export function MigrateUSDModal({
  onClose,
  isOpen,
  network,
  type,
  accountId,
}: {
  onClose: () => void;
  isOpen: boolean;
  network: Network;
  type: 'migration' | 'convert';
  accountId?: string;
}) {
  const [_params, setParams] = useParams<HomePageSchemaType>();

  const [step, setStep] = React.useState(0);
  const [amount, setAmount] = React.useState(ZEROWEI);

  React.useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setAmount(ZEROWEI);
    }
  }, [isOpen]);

  return (
    <Modal size="lg" isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent mt="100px" borderWidth="1px" borderColor="gray.900" bg="navy.900" color="white">
        <Flex justifyContent="space-between" p={6} alignItems="center">
          <Heading fontSize="20px">
            {step === 2 ? 'Migration successful' : 'Convert your V2 sUSD to V3 sUSD on Mainnet'}
          </Heading>
          <CloseButton onClick={onClose} color="gray" />
        </Flex>
        <Flex width="100%" px={6}>
          <Divider colorScheme="gray" />
        </Flex>
        <ModalBody p={6} pt={2}>
          {isOpen && (
            <>
              {step === 0 && (
                <StepIntro
                  amount={amount}
                  setAmount={setAmount}
                  onClose={onClose}
                  onConfirm={() => setStep(1)}
                  network={network}
                />
              )}
              {step === 1 && (
                <MigrateUSDTransaction
                  network={network}
                  onSuccess={() => {
                    if (type === 'migration') {
                      setStep(2);
                    } else {
                      onClose();
                    }
                  }}
                  onBack={() => setStep(0)}
                  amount={amount}
                />
              )}
              {step === 2 && (
                <StepSuccessFinal
                  network={network}
                  onConfirm={() => {
                    setParams({ accountId });
                    onClose();
                  }}
                />
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
