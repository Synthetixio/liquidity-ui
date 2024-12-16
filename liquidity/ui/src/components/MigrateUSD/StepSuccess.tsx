import { ArrowUpIcon, CheckIcon } from '@chakra-ui/icons';
import { Alert, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { ChangeStat } from '@snx-v3/ChangeStat';
import { ZEROWEI } from '@snx-v3/constants';
import { currency } from '@snx-v3/format';
import Wei from '@synthetixio/wei';
import React from 'react';
import { TransactionSummary } from '../TransactionSummary/TransactionSummary';

export const StepSuccess = ({
  onConfirm,
  v2Balance,
  v3Balance,
  amount,
}: {
  onConfirm: () => void;
  v2Balance: Wei;
  v3Balance: Wei;
  amount: Wei;
}) => {
  return (
    <VStack spacing={6}>
      <Text width="100%" textAlign="left" fontSize="14px">
        Your <b>V2 sUSD</b> has been converted to <b>V3 sUSD</b>
      </Text>

      <Alert rounded="base" colorScheme="green" borderRadius="6px">
        <Flex bg="green.500" p="1" rounded="full" mr="3.5">
          <CheckIcon w="12px" h="12px" color="green.900" />
        </Flex>
        <Text fontSize="16px">
          <b>sUSD</b> successfully converted
        </Text>
      </Alert>

      <TransactionSummary
        width="100%"
        items={[
          {
            label: 'Total V2 sUSD',
            value: (
              <ChangeStat
                value={v2Balance}
                newValue={v2Balance.sub(amount)}
                formatFn={(val?: Wei) => currency(val ?? ZEROWEI)}
                hasChanges
                size="sm"
              />
            ),
          },
          {
            label: 'Total V3 sUSD',
            value: (
              <ChangeStat
                value={v3Balance}
                newValue={v3Balance.add(amount)}
                formatFn={(val?: Wei) => currency(val ?? ZEROWEI)}
                hasChanges
                size="sm"
              />
            ),
          },
        ]}
      />

      <Button mb={-2} width="100%" onClick={onConfirm}>
        Continue
      </Button>

      <Button
        display="flex"
        alignItems="center"
        gap={1}
        variant="outline"
        colorScheme="gray"
        width="100%"
      >
        Deposit sUSD to Curve
        <ArrowUpIcon transform="rotate(45deg)" />
      </Button>
    </VStack>
  );
};
