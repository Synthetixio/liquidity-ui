import { CheckIcon } from '@chakra-ui/icons';
import {
  Button,
  CircularProgress,
  Divider,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { tokenOverrides } from '@snx-v3/constants';
import { etherscanLink } from '@snx-v3/etherscanLink';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useSynthBalances } from '@snx-v3/useSynthBalances';
import { Wei } from '@synthetixio/wei';
import React from 'react';

export function SynthsUnwrapModal({
  txnStatus,
  txnHash,
}: {
  txnStatus?: string;
  txnHash: string | null;
}) {
  const { network } = useNetwork();

  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => {
    if (txnStatus === 'prompting') {
      setIsOpen(true);
    }
    if (txnStatus === 'error') {
      setIsOpen(false);
    }
  }, [txnStatus]);

  const { data: synthBalances } = useSynthBalances();
  const filteredSynths = React.useMemo(() => {
    if (!synthBalances || !synthBalances.length) {
      return;
    }
    return synthBalances
      .map(({ synth, balance }) => ({
        balance,
        symbol: synth.token ? synth.token.symbol : synth.symbol,
        name: synth.token ? synth.token.name : synth.name,
        ...tokenOverrides[synth.token ? synth.token.address : synth.address],
      }))
      .filter(({ balance }) => balance.gt(0))
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .sort((a, b) => b.balance.toNumber() - a.balance.toNumber());
  }, [synthBalances]);

  // This caching is necessary to keep initial values after success and not reset them to zeroes
  const [cachedSynths, setCachedSynths] = React.useState<
    { symbol: string; name: string; balance: Wei }[] | undefined
  >();
  React.useEffect(() => {
    if (filteredSynths && !cachedSynths) {
      setCachedSynths(filteredSynths);
    }
  }, [filteredSynths, cachedSynths]);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <ModalOverlay bg="#06061B80" />
      <ModalContent
        bg="navy.700"
        mt="10%"
        borderWidth="1px"
        borderColor="gray.900"
        minWidth="384px"
      >
        <ModalBody data-cy="unwrap synths dialog" p={6}>
          <Text color="gray.50" fontSize="20px" fontWeight={700}>
            Unwrapping Synths
          </Text>

          <Divider my={4} />

          <Flex
            position="relative"
            alignItems="center"
            gap={4}
            mb={6}
            rounded="lg"
            mt="6"
            p="4"
            border="2px solid"
            transitionProperty="border-color"
            transitionDuration="normal"
            borderColor={txnStatus === 'success' ? 'green.500' : 'gray.900'}
          >
            <Flex
              justifyContent="center"
              alignItems="center"
              borderRadius="100px"
              bg={txnStatus === 'success' ? 'green.600' : 'gray.900'}
              width="40px"
              height="40px"
              p={3}
            >
              {txnStatus === 'success' ? (
                <CheckIcon color="white" />
              ) : (
                <CircularProgress size="25px" isIndeterminate color="gray.700" />
              )}
            </Flex>
            <Flex
              flexDirection="column"
              alignItems="space-between"
              justifyContent="space-between"
              ml={2}
              data-cy="unwrap synths info"
            >
              {cachedSynths ? (
                cachedSynths.map(({ symbol, balance }) => {
                  return (
                    <Text
                      key={symbol}
                      fontSize="14px"
                      fontWeight={700}
                      lineHeight="20px"
                      color="white"
                    >
                      <Amount
                        prefix={txnStatus === 'success' ? 'Unwrapped ' : 'Unwrapping '}
                        value={balance}
                        suffix={` ${symbol}`}
                      />
                    </Text>
                  );
                })
              ) : (
                <Text fontSize="12px" lineHeight="16px" color="gray.500">
                  Unwrapping your synths
                </Text>
              )}
            </Flex>
          </Flex>
          {txnStatus === 'success' ? (
            <Button
              mt={5}
              variant="solid"
              justifyContent="center"
              px={3}
              py={3}
              width="100%"
              textAlign="center"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          ) : null}
          {txnHash && (
            <Flex
              justifyContent="center"
              px={3}
              py={3}
              mt={6}
              mb={1}
              borderTop="1px solid"
              borderTopColor="gray.900"
              data-cy="transaction hash"
            >
              <Link
                variant="outline"
                href={etherscanLink({ chain: network?.name || '', address: txnHash, isTx: true })}
                fontFamily="heading"
                color="cyan.500"
                fontWeight={700}
                lineHeight="20px"
                fontSize="14px"
                target="_blank"
                mt={3}
              >
                View Transaction
              </Link>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
