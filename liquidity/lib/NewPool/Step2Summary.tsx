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
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { makeSearch, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import React from 'react';
import { formatCRatio } from './formatCRatio';
import { useMigrateNewPool } from './useMigrateNewPool';
import { useTargetCRatio } from './useTargetCRatio';

export function Step2Summary({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (receipt: ethers.providers.TransactionReceipt) => void;
}) {
  const [params, setParams] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType('SNX');

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { isReady, mutation } = useMigrateNewPool();
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
            {isPendingLiquidityPosition || isPendingSnxPrice ? (
              '~'
            ) : (
              <Amount
                prefix="$"
                value={
                  liquidityPosition && snxPrice
                    ? liquidityPosition.collateralAmount.mul(snxPrice)
                    : undefined
                }
                suffix=" SNX"
              />
            )}{' '}
          </HStack>

          <HStack fontWeight="700" justifyContent="space-between">
            <Text>C-Ratio</Text>
            <Text>
              {isPendingLiquidityPosition ? '~' : formatCRatio(liquidityPosition?.cRatio.toBN())}
            </Text>
          </HStack>
          <HStack fontWeight="700" justifyContent="space-between">
            <Text>Loan</Text>
            {isPendingLiquidityPosition ? (
              '~'
            ) : (
              <Amount
                prefix="$"
                value={liquidityPosition ? wei(liquidityPosition.debt) : undefined}
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
        in={liquidityPosition && liquidityPosition.cRatio.lt(targetCRatio)}
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

      <Button width="100%" isDisabled={!(isReady && isUnderstanding)} onClick={handleSubmit}>
        Migrate
      </Button>
      <Button variant="outline" colorScheme="gray" onClick={onClose} width="100%">
        Cancel
      </Button>
    </VStack>
  );
}
