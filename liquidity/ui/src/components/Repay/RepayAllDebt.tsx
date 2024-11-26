import { CheckIcon } from '@chakra-ui/icons';
import { Alert, Button, Divider, Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { parseUnits } from '@snx-v3/format';
import { getSpotMarketId, isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useClearDebt } from '@snx-v3/useClearDebt';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { useGetWrapperToken } from '@snx-v3/useGetUSDTokens';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { wei } from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

export const RepayAllDebt = ({ liquidityPosition }: { liquidityPosition: LiquidityPosition }) => {
  const { network } = useNetwork();
  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const params = useParams();
  const [searchParams] = useSearchParams();

  const queryClient = useQueryClient();

  const debtExists = liquidityPosition.debt.gt(0.01);
  const currentDebt = debtExists ? liquidityPosition.debt : wei(0);
  const { data: systemToken } = useSystemToken();
  const { data: wrapperToken } = useGetWrapperToken(getSpotMarketId(params.collateralSymbol));

  const { data: tokenBalance } = useTokenBalance(
    isBase ? wrapperToken : liquidityPosition.tokenAddress
  );

  const sufficientBalance = useMemo(
    () => Number(tokenBalance?.toString()) >= currentDebt.toNumber(),
    [currentDebt, tokenBalance]
  );

  const {
    exec: execRepay,
    settle: settleRepay,
    isLoading,
  } = useClearDebt({
    accountId: searchParams.get('accountId') || '',
    poolId: params.poolId,
    collateralTypeAddress: liquidityPosition?.tokenAddress,
    availableUSDCollateral: liquidityPosition.accountCollateral.availableCollateral,
    debt: currentDebt,
  });

  const { data: DebtRepayer } = useDebtRepayer();
  const {
    approve,
    requireApproval,
    isLoading: approvalLoading,
  } = useApprove({
    contractAddress: wrapperToken,
    //slippage for approval
    amount: parseUnits(currentDebt.toString(), 6).mul(110).div(100),
    spender: DebtRepayer?.address,
  });

  const submit = useCallback(async () => {
    try {
      if (requireApproval) {
        await approve(false);
      }
      await execRepay();

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
  }, [approve, execRepay, network?.id, network?.preset, queryClient, requireApproval, settleRepay]);

  if (liquidityPosition.debt.lte(0)) {
    return (
      <Alert data-cy="repay debt success" my={2} status="success" rounded="base" borderRadius="6px">
        <Flex bg="green.500" p="1" rounded="full" mr="2">
          <CheckIcon w="12px" h="12px" color="green.900" />
        </Flex>
        <Text color="white" fontSize="16px" fontWeight={400}>
          Your account currently has no debt.
        </Text>
      </Alert>
    );
  }

  return (
    <Flex data-cy="repay debt form" flexDirection="column">
      <Text fontSize="md" fontWeight="700" mb="0.5">
        Repay {isBase ? params.collateralSymbol : systemToken?.symbol}
      </Text>
      <Text fontSize="sm" color="gray.400" mb="4">
        Your account currently has a positive debt. This amount must be paid to initiate collateral
        withdrawal.
      </Text>
      <Button
        isDisabled={!sufficientBalance}
        isLoading={isLoading || approvalLoading}
        onClick={submit}
        data-cy="repay debt submit"
      >
        <Amount
          prefix="Repay USDC $"
          value={currentDebt}
          suffix={sufficientBalance ? '' : ' (Insufficient Balance)'}
        />
      </Button>
    </Flex>
  );
};
