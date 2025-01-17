import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Collapse,
  Flex,
  Link,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ChangeStat } from '@snx-v3/ChangeStat';
import { ZEROWEI } from '@snx-v3/constants';
import { currency, parseUnits } from '@snx-v3/format';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { makeSearch, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePoolConfiguration } from '@snx-v3/usePoolConfiguration';
import { useWithdrawTimer } from '@snx-v3/useWithdrawTimer';
import { validatePosition } from '@snx-v3/validatePosition';
import Wei, { wei } from '@synthetixio/wei';
import React from 'react';
import { CRatioChangeStat } from '../CRatioBar/CRatioChangeStat';
import { TransactionSummary } from '../TransactionSummary/TransactionSummary';
import { useUndelegate } from '@snx-v3/useUndelegate';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { ContractError } from '@snx-v3/ContractError';
import { UndelegateModal } from './UndelegateModal';
import { useUndelegateBaseAndromeda } from '@snx-v3/useUndelegateBaseAndromeda';
import { useUSDC } from '@snx-v3/useUSDC';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { useApprove } from '@snx-v3/useApprove';

export function Undelegate() {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  const { collateralChange, debtChange, setCollateralChange } =
    React.useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const poolConfiguration = usePoolConfiguration();
  const { network } = useNetwork();
  const { data: USDC } = useUSDC();
  const { data: DebtRepayer } = useDebtRepayer();

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const collateralPrice = liquidityPosition?.collateralPrice;

  const { newDebt } = validatePosition({
    issuanceRatioD18: collateralType?.issuanceRatioD18,
    collateralAmount: liquidityPosition?.collateralAmount,
    collateralPrice,
    debt: liquidityPosition?.debt,
    collateralChange: collateralChange,
    debtChange: debtChange,
  });

  const {
    approve,
    requireApproval,
    txnState: approvalTxnState,
    isReady: isReadyApprove,
  } = useApprove({
    contractAddress: USDC?.address,
    //slippage for approval
    amount:
      liquidityPosition && liquidityPosition.debt.gt(0)
        ? parseUnits(liquidityPosition.debt.toString(), 6).mul(120).div(100)
        : undefined,
    spender: DebtRepayer?.address,
  });

  const {
    isReady: isReadyUndelegate,
    txnState: undelegateTxnState,
    mutation: undelegate,
  } = useUndelegate({
    undelegateAmount:
      collateralChange && collateralChange.lt(0) ? collateralChange.abs() : undefined,
  });

  const {
    isReady: isReadyUndelegateAndromeda,
    txnState: undelegateAndromedaTxnState,
    mutation: undelegateAndromeda,
  } = useUndelegateBaseAndromeda({
    undelegateAmount:
      collateralChange && collateralChange.lt(0) ? collateralChange.abs() : undefined,
  });

  const isReady =
    (network?.preset === 'andromeda' ? isReadyUndelegateAndromeda : isReadyUndelegate) &&
    isReadyApprove;
  const txnState =
    network?.preset === 'andromeda' ? undelegateAndromedaTxnState : undelegateTxnState;

  const maxWithdrawable = liquidityPosition?.availableCollateral;

  // To get the max withdrawable collateral we look at the new debt and the issuance ratio.
  // This gives us the amount in dollar. We then divide by the collateral price.
  // To avoid the transaction failing due to small price deviations, we also apply a 2% buffer by multiplying with 0.98
  const max = (() => {
    if (!liquidityPosition || !collateralType) {
      return undefined;
    }
    const { collateralAmount, collateralValue } = liquidityPosition;

    if (network?.preset === 'andromeda') {
      return collateralAmount;
    }

    // if debt is negative it's actually credit, which means we can undelegate all collateral
    if (newDebt.lte(0)) return collateralAmount;

    const minCollateralRequired = newDebt.mul(collateralType.liquidationRatioD18);

    if (collateralValue.lt(minCollateralRequired))
      // If you're below issuance ratio, you can't withdraw anything
      return wei(0);

    const maxWithdrawable = collateralValue.sub(minCollateralRequired).mul(0.98);

    return Wei.min(collateralAmount, maxWithdrawable);
  })();

  const isLoadingRequiredData = poolConfiguration.isLoading || !max;
  const isAnyMarketLocked = poolConfiguration.data?.isAnyMarketLocked;

  const { minutes, hours, isRunning } = useWithdrawTimer(params.accountId);

  const leftoverCollateral = liquidityPosition?.collateralAmount?.add(collateralChange) || wei(0);
  const isValidLeftover =
    leftoverCollateral.gte(collateralType?.minDelegationD18 || wei(0)) || leftoverCollateral.eq(0);

  const isInputDisabled = isAnyMarketLocked;
  const overAvailableBalance = max ? collateralChange.abs().gt(max) : false;
  const isSubmitDisabled =
    !isReady ||
    isLoadingRequiredData ||
    isAnyMarketLocked ||
    collateralChange.gte(0) ||
    !isValidLeftover ||
    overAvailableBalance;

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();

  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        toast.closeAll();
        toast({ title: 'Undelegating...', variant: 'left-accent' });

        if (network?.preset === 'andromeda') {
          if (requireApproval) {
            await approve(false);
          }
          await undelegateAndromeda.mutateAsync();
        } else {
          await undelegate.mutateAsync();
        }

        setCollateralChange(ZEROWEI);

        toast.closeAll();
        toast({
          title: 'Success',
          description: 'Your collateral has been updated.',
          status: 'success',
          duration: 5000,
          variant: 'left-accent',
        });
      } catch (error: any) {
        const contractError = errorParser(error);
        if (contractError) {
          console.error(new Error(contractError.name), contractError);
        }
        toast({
          title: 'Could not complete repaying',
          description: contractError ? (
            <ContractError contractError={contractError} />
          ) : (
            'Please try again.'
          ),
          status: 'error',
          variant: 'left-accent',
          duration: 3_600_000,
        });
        throw Error('Undelegate failed', { cause: error });
      }
    },
    [
      approve,
      errorParser,
      network?.preset,
      requireApproval,
      setCollateralChange,
      toast,
      undelegate,
      undelegateAndromeda,
    ]
  );

  return (
    <Flex flexDirection="column" data-cy="undelegate collateral form">
      <UndelegateModal
        txnStatus={txnState.txnStatus}
        txnHash={txnState.txnHash}
        approvalTxnStatus={approvalTxnState.txnStatus}
      />
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        Unlock Collateral
      </Text>

      <BorderBox display="flex" p={3} mb="6">
        <Flex alignItems="flex-start" flexDir="column" gap="1">
          <BorderBox display="flex" py={1.5} px={2.5}>
            <Text display="flex" gap={2} alignItems="center" fontWeight="600">
              <TokenIcon
                symbol={collateralType?.symbol ?? params.collateralSymbol}
                width={16}
                height={16}
              />
              {collateralType?.displaySymbol ?? params.collateralSymbol}
            </Text>
          </BorderBox>
          <Text fontSize="12px" whiteSpace="nowrap" data-cy="locked amount">
            {isPendingLiquidityPosition ? 'Locked: ~' : null}
            {!isPendingLiquidityPosition && max ? (
              <>
                <Amount prefix="Locked: " value={max} />
                &nbsp;
                <Text
                  as="span"
                  cursor="pointer"
                  onClick={() => setCollateralChange(max.mul(-1))}
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
              isDisabled: isInputDisabled,
              isRequired: true,
              'data-cy': 'undelegate amount input',
              type: 'number',
              min: 0,
            }}
            value={collateralChange.abs()}
            onChange={(val) => setCollateralChange(val.mul(-1))}
            max={max}
            min={ZEROWEI}
          />
          <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
            {isPendingLiquidityPosition ? '~' : null}
            {!isPendingLiquidityPosition &&
            liquidityPosition &&
            liquidityPosition.collateralPrice.gt(0) ? (
              <Amount
                prefix="$"
                value={collateralChange.abs().mul(liquidityPosition.collateralPrice)}
              />
            ) : null}
          </Flex>
        </Flex>
      </BorderBox>

      <Collapse in={isInputDisabled} animateOpacity unmountOnExit>
        <Alert mb={6} status="warning" borderRadius="6px">
          <AlertIcon />
          <Flex direction="column">
            <AlertTitle>Credit capacity reached</AlertTitle>
            <AlertDescription>
              One of the markets has reached its credit capacity and is currently in a locked state.
              You cannot unlock collateral from the pool at this time.
            </AlertDescription>
          </Flex>
        </Alert>
      </Collapse>

      {collateralType ? (
        <Collapse in={!isValidLeftover && !collateralChange.eq(0)} animateOpacity unmountOnExit>
          <Alert mb={6} status="info" borderRadius="6px">
            <AlertIcon />
            <Flex direction="column">
              <AlertTitle>
                The minimal locked amount is{' '}
                <Amount
                  value={collateralType.minDelegationD18}
                  suffix={` ${collateralType?.displaySymbol ?? params.collateralSymbol}`}
                />
              </AlertTitle>
              <AlertDescription>
                You can close your position by removing all the collateral.
              </AlertDescription>
            </Flex>
          </Alert>
        </Collapse>
      ) : null}

      <Collapse
        in={collateralChange.abs().gt(0) && isValidLeftover && isRunning}
        animateOpacity
        unmountOnExit
      >
        <Alert status="warning" mb="6">
          <AlertIcon />
          <Text>
            You will be able to withdraw assets in {hours}H{minutes}M. Any account activity will
            reset this timer to 24H.
          </Text>
        </Alert>
      </Collapse>

      {liquidityPosition ? (
        <Collapse
          in={
            collateralChange.abs().gt(0) && isValidLeftover && !isRunning && maxWithdrawable?.gt(0)
          }
          animateOpacity
          unmountOnExit
        >
          <Alert status="info" mb="6" borderRadius="6px">
            <AlertIcon />
            <Text>
              You already have{' '}
              <Amount
                value={maxWithdrawable}
                suffix={` ${liquidityPosition.collateralType.symbol}`}
              />{' '}
              unlocked. &nbsp;
              <Link
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: params.collateralSymbol,
                  manageAction: 'withdraw',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: params.collateralSymbol,
                    manageAction: 'withdraw',
                    accountId: params.accountId,
                  });
                }}
                textDecoration="underline"
              >
                Withdraw
              </Link>{' '}
              before unlocking again as it will restart the 24h withdrawal timeout.
            </Text>
          </Alert>
        </Collapse>
      ) : null}

      {network?.preset === 'andromeda' && liquidityPosition ? (
        <Collapse in={liquidityPosition.debt.gt(0)} animateOpacity unmountOnExit>
          <Alert status="error" mb="6" borderRadius="6px">
            <AlertIcon />
            <Text>
              To unlock this amount, you need to{' '}
              <Link
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: params.collateralSymbol,
                  manageAction: 'repay',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: params.collateralSymbol,
                    manageAction: 'repay',
                    accountId: params.accountId,
                  });
                }}
                textDecoration="underline"
              >
                <Amount
                  prefix=" repay "
                  value={liquidityPosition.debt}
                  suffix={` ${liquidityPosition.collateralType.symbol}`}
                />
              </Link>{' '}
              to your position
            </Text>
          </Alert>
        </Collapse>
      ) : null}

      {liquidityPosition ? (
        <Collapse in={collateralChange.abs().gt(0)} animateOpacity unmountOnExit>
          <TransactionSummary
            mb={6}
            items={[
              {
                label: `Locked ${collateralType?.displaySymbol ?? params.collateralSymbol}`,
                value: (
                  <ChangeStat
                    value={liquidityPosition.collateralAmount || ZEROWEI}
                    newValue={leftoverCollateral}
                    formatFn={(val?: Wei) => currency(val ?? ZEROWEI)}
                    hasChanges={collateralChange.abs().gt(0)}
                    size="sm"
                  />
                ),
              },
              ...(network?.preset !== 'andromeda'
                ? [
                    {
                      label: 'C-ratio',
                      value: (
                        <CRatioChangeStat
                          currentCollateral={liquidityPosition.collateralAmount}
                          currentDebt={liquidityPosition.debt}
                          collateralChange={collateralChange}
                          collateralPrice={liquidityPosition.collateralPrice}
                          debtChange={ZEROWEI}
                          size="sm"
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </Collapse>
      ) : null}

      <Button
        onClick={onSubmit}
        data-cy="undelegate submit"
        type="submit"
        isDisabled={isSubmitDisabled}
      >
        {collateralChange.gte(0) ? 'Enter Amount' : 'Unlock Collateral'}
      </Button>
    </Flex>
  );
}
