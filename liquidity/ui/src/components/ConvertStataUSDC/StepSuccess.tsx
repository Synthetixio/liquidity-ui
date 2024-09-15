import React from 'react';
import { VStack, Text, Button, Alert, Flex } from '@chakra-ui/react';
import { /*ArrowUpIcon, */ CheckIcon } from '@chakra-ui/icons';
import { TransactionSummary } from '../TransactionSummary/TransactionSummary';
import Wei from '@synthetixio/wei';
import { currency } from '@snx-v3/format';
import { ChangeStat } from '../ChangeStat';

export const StepSuccess = ({
  onConfirm,
  usdcBalance,
  changeUsdcBalance,
  oldStataUSDCBalance,
  newStataUSDCBalance,
}: {
  onConfirm: () => void;
  usdcBalance: Wei;
  changeUsdcBalance: Wei;
  oldStataUSDCBalance: Wei;
  newStataUSDCBalance: Wei;
}) => {

  return (
    <VStack spacing={6}>
      <Text width="100%" textAlign="left" fontSize="14px">
        Your <b>USDC</b> has been converted to <b>stataUSDC</b>
      </Text>

      <Alert rounded="base" colorScheme="green" borderRadius="6px">
        <Flex bg="green.500" p="1" rounded="full" mr="3.5">
          <CheckIcon w="12px" h="12px" color="green.900" />
        </Flex>
        <Text fontSize="16px">
          <b>USDC</b> successfully converted
        </Text>
      </Alert>

      <TransactionSummary
        width="100%"
        items={[
          {
            label: 'Total USDC',
            value: (
              <ChangeStat
                value={usdcBalance}
                newValue={usdcBalance.sub(changeUsdcBalance)}
                formatFn={(val: Wei) => currency(val)}
                hasChanges
                size="sm"
              />
            ),
          },
          {
            label: 'Total stataUSDC',
            value: (
              <ChangeStat
                value={oldStataUSDCBalance}
                newValue={newStataUSDCBalance}
                formatFn={(val: Wei) => currency(val)}
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

      {/*<Button
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
      */}
    </VStack>
  );
};
