import { CheckIcon } from '@chakra-ui/icons';
import { Alert, Button, Flex, Link, Text, VStack } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { transactionLink } from '@snx-v3/etherscanLink';
import { TransactionSummary } from '@snx-v3/TransactionSummary';
import { useNetwork } from '@snx-v3/useBlockchain';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { useCurrentLoanedAmount } from './useCurrentLoanedAmount';
import { usePositionCollateral } from './usePositionCollateral';

export const Step3Success = ({
  receipt,
  onConfirm,
}: {
  receipt?: {
    transactionHash: string;
  };
  onConfirm: () => void;
}) => {
  const { network } = useNetwork();
  const { data: positionCollateral, isPending: isPendingPositionCollateral } =
    usePositionCollateral();
  const { data: loanedAmount, isPending: isPendingLoanedAmount } = useCurrentLoanedAmount();
  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');

  return (
    <VStack spacing={6}>
      <Text width="100%" textAlign="left" fontSize="14px">
        Your <b>Collateral</b> has been migrated to Delegated Staking
      </Text>

      <Alert rounded="base" colorScheme="green" borderRadius="6px">
        <Flex bg="green.500" p="1" rounded="full" mr="3.5">
          <CheckIcon w="12px" h="12px" color="green.900" />
        </Flex>
        <Text fontSize="16px">
          <b>Collateral</b> successfully migrated
        </Text>
      </Alert>

      <TransactionSummary
        width="100%"
        items={[
          {
            label: 'Total collateral',
            value:
              isPendingPositionCollateral || isPendingSnxPrice ? (
                '~'
              ) : (
                <Amount
                  prefix="$"
                  value={
                    positionCollateral && snxPrice
                      ? wei(positionCollateral).mul(snxPrice)
                      : undefined
                  }
                  suffix=" SNX"
                />
              ),
          },
          {
            label: 'Loaned amount',
            value: isPendingLoanedAmount ? (
              '~'
            ) : (
              <Amount
                prefix="$"
                value={loanedAmount ? wei(loanedAmount) : undefined}
                suffix=" sUSD"
              />
            ),
          },
          {
            label: 'Transaction',
            value: (
              <Link
                isExternal
                variant="outline"
                href={transactionLink({ chainId: network?.id, txnHash: receipt?.transactionHash })}
                fontFamily="heading"
                color="cyan.500"
                cursor="pointer"
                fontWeight={700}
                target="_blank"
                alignItems="center"
                gap={1}
              >
                {receipt?.transactionHash.slice(0, 5)}...{receipt?.transactionHash.slice(-4)}
              </Link>
            ),
          },
        ]}
      />

      <Button width="100%" onClick={onConfirm}>
        Continue
      </Button>
    </VStack>
  );
};
