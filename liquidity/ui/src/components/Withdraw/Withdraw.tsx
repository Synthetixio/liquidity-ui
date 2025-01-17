import { Alert, AlertIcon, Button, Collapse, Flex, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { useAccountCollateralUnlockDate } from '@snx-v3/useAccountCollateralUnlockDate';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useWithdraw } from '@snx-v3/useWithdraw';
import { useWithdrawTimer } from '@snx-v3/useWithdrawTimer';
import React from 'react';
import { WithdrawModal } from './WithdrawModal';

export function Withdraw({ isDebtWithdrawal = false }: { isDebtWithdrawal?: boolean }) {
  const [params] = useParams<PositionPageSchemaType>();
  const { setWithdrawAmount, withdrawAmount } = React.useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: systemToken } = useSystemToken();

  const { data: accountCollateralUnlockDate, isLoading: isLoadingDate } =
    useAccountCollateralUnlockDate({ accountId: params.accountId });

  const symbol = isDebtWithdrawal ? systemToken?.symbol : collateralType?.symbol;
  const displaySymbol = isDebtWithdrawal
    ? systemToken?.displaySymbol
    : collateralType?.displaySymbol;
  const { minutes, hours, isRunning } = useWithdrawTimer(params.accountId);
  const unlockDate = !isLoadingDate ? accountCollateralUnlockDate : null;

  const maxWithdrawable = React.useMemo(() => {
    if (isDebtWithdrawal && liquidityPosition) {
      return liquidityPosition.availableSystemToken;
    }
    if (!isDebtWithdrawal && liquidityPosition) {
      return liquidityPosition.availableCollateral;
    }
  }, [isDebtWithdrawal, liquidityPosition]);

  const {
    mutation: withdraw,
    isReady: isWithdrawReady,
    txnState,
  } = useWithdraw({
    amount: withdrawAmount,
    accountId: params.accountId,
    token: isDebtWithdrawal ? systemToken : collateralType,
  });

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();
  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        toast.closeAll();
        toast({ title: 'Withdrawing...', variant: 'left-accent' });

        await withdraw.mutateAsync();
        setWithdrawAmount(ZEROWEI);

        toast.closeAll();
        toast({
          title: 'Success',
          description: 'Withdrawal was successful',
          status: 'success',
          duration: 5000,
          variant: 'left-accent',
        });
      } catch (error: any) {
        const contractError = errorParser(error);
        if (contractError) {
          console.error(new Error(contractError.name), contractError);
        }
        toast.closeAll();
        toast({
          title: 'Could not complete withdrawing',
          description: contractError ? (
            <ContractError contractError={contractError} />
          ) : (
            'Please try again.'
          ),
          status: 'error',
          variant: 'left-accent',
          duration: 3_600_000,
        });
      }
    },
    [errorParser, setWithdrawAmount, toast, withdraw]
  );

  return (
    <Flex flexDirection="column" data-cy="withdraw form" as="form" onSubmit={onSubmit}>
      <WithdrawModal
        isDebtWithdrawal={isDebtWithdrawal}
        txnStatus={txnState.txnStatus}
        txnHash={txnState.txnHash}
      />
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        {isDebtWithdrawal ? 'Withdraw' : 'Withdraw Collateral'}
      </Text>
      <BorderBox display="flex" p={3} mb="6">
        <Flex alignItems="flex-start" flexDir="column" gap="1">
          <BorderBox display="flex" py={1.5} px={2.5}>
            <Text
              display="flex"
              gap={2}
              fontSize="16px"
              alignItems="center"
              fontWeight="600"
              whiteSpace="nowrap"
            >
              <TokenIcon symbol={symbol} width={16} height={16} />
              {isDebtWithdrawal ? systemToken?.displaySymbol : collateralType?.displaySymbol}
            </Text>
          </BorderBox>
          <Text fontSize="12px" whiteSpace="nowrap" data-cy="withdraw amount">
            {isDebtWithdrawal && isPendingLiquidityPosition ? 'Available: ~' : null}
            {!isDebtWithdrawal && isPendingLiquidityPosition ? 'Unlocked: ~' : null}
            {maxWithdrawable ? (
              <>
                <Amount
                  prefix={isDebtWithdrawal ? 'Available: ' : 'Unlocked: '}
                  value={maxWithdrawable}
                />
                &nbsp;
                <Text
                  as="span"
                  cursor="pointer"
                  onClick={() => setWithdrawAmount(maxWithdrawable)}
                  color="cyan.500"
                  fontWeight={700}
                >
                  Max
                </Text>
              </>
            ) : null}
          </Text>
        </Flex>
        <Flex flexDir="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              isRequired: true,
              'data-cy': 'withdraw amount input',
              type: 'number',
              min: 0,
            }}
            value={withdrawAmount}
            onChange={(val) => setWithdrawAmount(val)}
            max={maxWithdrawable}
            min={ZEROWEI}
          />
          <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
            {isPendingLiquidityPosition ? '~' : null}
            {!isPendingLiquidityPosition &&
            liquidityPosition &&
            liquidityPosition.collateralPrice.gt(0) ? (
              <Amount
                prefix="$"
                value={withdrawAmount.abs().mul(liquidityPosition.collateralPrice)}
              />
            ) : null}
          </Flex>
        </Flex>
      </BorderBox>

      <Collapse
        in={maxWithdrawable && maxWithdrawable.gt(0) && isRunning}
        animateOpacity
        unmountOnExit
      >
        <Alert status="warning" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You will be able to withdraw assets in {hours}H{minutes}M. Any account activity will
            reset this timer to 24H.
          </Text>
        </Alert>
      </Collapse>

      <Collapse
        in={maxWithdrawable && maxWithdrawable.gt(0) && !isRunning}
        animateOpacity
        unmountOnExit
      >
        <Alert status="success" mb="6" borderRadius="6px">
          <AlertIcon />
          <Amount
            prefix="You can now withdraw "
            value={maxWithdrawable}
            suffix={` ${displaySymbol}`}
          />
        </Alert>
      </Collapse>

      <Collapse
        in={maxWithdrawable && withdrawAmount.gt(maxWithdrawable)}
        animateOpacity
        unmountOnExit
      >
        <Alert colorScheme="red" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You cannot Withdraw more {!isDebtWithdrawal ? 'Collateral' : ''} than your Unlocked
            Balance
          </Text>
        </Alert>
      </Collapse>

      <Button
        isDisabled={
          !isWithdrawReady ||
          isRunning ||
          !unlockDate ||
          (maxWithdrawable && withdrawAmount.gt(maxWithdrawable))
        }
        data-cy="withdraw submit"
        type="submit"
      >
        {withdrawAmount.gt(0) ? 'Withdraw' : 'Enter Amount'}
      </Button>
    </Flex>
  );
}
