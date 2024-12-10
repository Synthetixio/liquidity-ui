import { CheckIcon } from '@chakra-ui/icons';
import { Alert, Button, Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { parseUnits } from '@snx-v3/format';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useClearDebt } from '@snx-v3/useClearDebt';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useUSDC } from '@snx-v3/useUSDC';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

export function RepayAndromedaDebt() {
  const [params] = useParams<PositionPageSchemaType>();
  const { network } = useNetwork();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  // Andromeda users pay with USDC
  const { data: USDC } = useUSDC();
  const { data: usdcBalance } = useTokenBalance(USDC?.address);

  const {
    exec: clearDebt,
    settle: settleRepay,
    isLoading,
  } = useClearDebt({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralTypeAddress: collateralType?.address,
  });

  const { data: DebtRepayer } = useDebtRepayer();
  const {
    approve,
    requireApproval,
    isLoading: approvalLoading,
  } = useApprove({
    contractAddress: USDC?.address,
    // slippage for approval
    amount: liquidityPosition
      ? parseUnits(liquidityPosition.debt.toString(), 6).mul(150).div(100)
      : 0,
    spender: DebtRepayer?.address,
  });

  const queryClient = useQueryClient();
  const submit = React.useCallback(async () => {
    try {
      if (requireApproval) {
        await approve(false);
      }
      await clearDebt();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
        }),
        queryClient.invalidateQueries({
          queryKey: [`${network?.id}-${network?.preset}`, 'Allowance'],
        }),
        queryClient.invalidateQueries({
          queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPosition'],
        }),
        queryClient.invalidateQueries({
          queryKey: [`${network?.id}-${network?.preset}`, 'AccountCollateralUnlockDate'],
        }),
      ]);

      settleRepay();
    } catch (error) {}
  }, [approve, clearDebt, network?.id, network?.preset, queryClient, requireApproval, settleRepay]);

  const hasEnoughBalance =
    liquidityPosition &&
    usdcBalance &&
    liquidityPosition.availableSystemToken.add(usdcBalance).gte(liquidityPosition.debt);

  return (
    <Flex data-cy="repay debt form" flexDirection="column">
      <Text fontSize="md" fontWeight="700" mb="0.5">
        Repay USDC
      </Text>
      {liquidityPosition ? (
        <>
          {liquidityPosition.debt.lte(0) ? (
            <Alert
              data-cy="repay debt success"
              my={2}
              status="success"
              rounded="base"
              borderRadius="6px"
            >
              <Flex bg="green.500" p="1" rounded="full" mr="2">
                <CheckIcon w="12px" h="12px" color="green.900" />
              </Flex>
              <Text color="white" fontSize="16px" fontWeight={400}>
                Your account currently has no debt.
              </Text>
            </Alert>
          ) : null}

          {liquidityPosition.debt.gt(0) ? (
            <>
              <Text fontSize="sm" color="gray.400" mb="4">
                Your account currently has a positive debt. This amount must be paid to initiate
                collateral withdrawal.
              </Text>
              <Button
                isDisabled={!hasEnoughBalance}
                isLoading={isLoading || approvalLoading}
                onClick={submit}
                data-cy="repay debt submit"
              >
                <Amount
                  prefix="Repay USDC $"
                  value={liquidityPosition.debt}
                  suffix={hasEnoughBalance ? '' : ' (Insufficient Balance)'}
                />
              </Button>
            </>
          ) : null}
        </>
      ) : null}
    </Flex>
  );
}
