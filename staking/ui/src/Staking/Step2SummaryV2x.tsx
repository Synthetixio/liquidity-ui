import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Collapse,
  Heading,
  HStack,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { makeSearch, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import React from 'react';
import { formatCRatio } from './formatCRatio';
import { useMigrateNewPoolV2x } from './useMigrateNewPoolV2x';
import { useTargetCRatio } from './useTargetCRatio';
import { useV2xPosition } from './useV2xPosition';

export function Step2SummaryV2x({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (receipt: ethers.providers.TransactionReceipt) => void;
}) {
  const [params, setParams] = useParams<PositionPageSchemaType>();

  const { data: v2xPosition, isPending: isPendingV2xPosition } = useV2xPosition();

  const { isReady, mutation } = useMigrateNewPoolV2x();
  const { data: targetCRatio } = useTargetCRatio();

  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');

  const [isUnderstanding, setIsUnderstanding] = React.useState(false);

  const handleSubmit = React.useCallback(() => {
    mutation.mutateAsync().then(onConfirm);
  }, [mutation, onConfirm]);

  return (
    <VStack spacing={2.5} align="start" fontSize="12px">
      <Heading size="sm">Summary of your migration</Heading>
      <Box p={3.5} borderRadius="4px" background="#1F1F34" width="100%">
        <VStack align="stretch" spacing={3}>
          <HStack fontWeight="700" justifyContent="space-between">
            <Text>Total collateral</Text>
            {isPendingV2xPosition || isPendingSnxPrice ? (
              '~'
            ) : (
              <Amount
                prefix="$"
                value={
                  v2xPosition && snxPrice
                    ? wei(v2xPosition.collateralAmount).mul(snxPrice)
                    : undefined
                }
                suffix=" SNX"
              />
            )}{' '}
          </HStack>

          <HStack fontWeight="700" justifyContent="space-between">
            <Text>C-Ratio</Text>
            <Text>{isPendingV2xPosition ? '~' : formatCRatio(v2xPosition?.cRatio)}</Text>
          </HStack>
          <HStack fontWeight="700" justifyContent="space-between" color="green.500">
            <Text>Loan Forgiven</Text>
            {isPendingV2xPosition ? (
              '~'
            ) : (
              <Amount
                prefix="$"
                value={v2xPosition ? wei(v2xPosition.debt) : undefined}
                suffix=" sUSD"
              />
            )}
          </HStack>
        </VStack>
      </Box>
      <Checkbox size="sm" onChange={(e) => setIsUnderstanding(e.currentTarget.checked)}>
        I understand that this action cannot be undone
      </Checkbox>

      <Collapse
        in={v2xPosition && v2xPosition.cRatio.gt(0) && v2xPosition.cRatio.lt(targetCRatio)}
        animateOpacity
        unmountOnExit
      >
        <Alert mb={3.5} status="error" borderRadius="6px">
          <AlertIcon />
          <AlertDescription fontSize="16px">
            The minimal C-Ratio for migration to Delegated Staking is{' '}
            <b>{formatCRatio(targetCRatio)}</b>. You can repay debt and increase your C-Ratio on the{' '}
            <Link
              textDecoration="underline"
              href={`?${makeSearch({
                page: 'position',
                collateralSymbol: 'SNX',
                manageAction: 'repay',
                accountId: params.accountId,
              })}`}
              onClick={(e) => {
                e.preventDefault();
                setParams({
                  page: 'position',
                  collateralSymbol: 'SNX',
                  manageAction: 'repay',
                  accountId: params.accountId,
                });
              }}
            >
              Manage Position page
            </Link>
          </AlertDescription>
        </Alert>
      </Collapse>

      <Button
        width="100%"
        isLoading={mutation.isPending}
        isDisabled={!(isReady && isUnderstanding && !mutation.isPending)}
        onClick={handleSubmit}
      >
        Migrate
      </Button>
      <Button variant="outline" colorScheme="gray" onClick={onClose} width="100%">
        Cancel
      </Button>
    </VStack>
  );
}
