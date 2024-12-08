import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { currency, parseUnits } from '@snx-v3/format';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { CollateralType, useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useUndelegate } from '@snx-v3/useUndelegate';
import { useUndelegateBaseAndromeda } from '@snx-v3/useUndelegateBaseAndromeda';
import { useUSDC } from '@snx-v3/useUSDC';
import { Wei, wei } from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import { useMachine } from '@xstate/react';
import { FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { StateFrom } from 'xstate';
import { ChangeStat } from '../../ui/src/components/ChangeStat/ChangeStat';
import { CRatioChangeStat } from '../../ui/src/components/CRatioBar/CRatioChangeStat';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { TransactionSummary } from '../../ui/src/components/TransactionSummary/TransactionSummary';
import { Events, ServiceNames, State, UndelegateMachine } from './UndelegateMachine';

export const UndelegateModalUi: FC<{
  amount: Wei;
  isOpen: boolean;
  onClose: () => void;
  collateralType?: CollateralType;
  state: StateFrom<typeof UndelegateMachine>;
  error: { error: Error; step: string } | null;
  onSubmit: () => void;
  txSummary?: ReactNode;
}> = ({ txSummary, amount, isOpen, onClose, collateralType, onSubmit, state, error }) => {
  const isProcessing = state.matches(State.undelegate);
  if (isOpen) {
    if (state.matches(State.success)) {
      return (
        <LiquidityPositionUpdated
          onClose={onSubmit}
          title="Collateral successfully Updated"
          subline={
            <>
              Your <b>Collateral</b> has been updated, read more about it in the{' '}
              <Link
                href="https://docs.synthetix.io/v/synthetix-v3-user-documentation"
                target="_blank"
                color="cyan.500"
              >
                Synthetix V3 Documentation
              </Link>
            </>
          }
          alertText={
            <>
              <b>Collateral</b> successfully Updated
            </>
          }
          summary={txSummary}
        />
      );
    }

    return (
      <div data-cy="undelegate multistep">
        <Text color="gray.50" fontSize="20px" fontWeight={700}>
          <ArrowBackIcon cursor="pointer" onClick={onClose} mr={2} />
          Manage Collateral
        </Text>
        <Divider my={4} />
        <Multistep
          step={1}
          title="Unlock collateral"
          subtitle={
            <Amount
              value={amount}
              suffix={` ${collateralType?.displaySymbol} will be unlocked from the pool.`}
            />
          }
          status={{
            failed: Boolean(error?.step === State.undelegate),
            disabled: amount.eq(0),
            success: state.matches(State.success),
            loading: state.matches(State.undelegate) && !error,
          }}
        />

        <Button
          isDisabled={isProcessing}
          onClick={onSubmit}
          width="100%"
          mt="6"
          data-cy="undelegate confirm button"
        >
          {(() => {
            switch (true) {
              case Boolean(error):
                return 'Retry';
              case isProcessing:
                return 'Processing...';
              case state.matches(State.success):
                return 'Continue';
              default:
                return 'Execute Transaction';
            }
          })()}
        </Button>
      </div>
    );
  }
};
export type UndelegateModalProps = FC<{
  isOpen: boolean;
  onClose: () => void;
  liquidityPosition?: LiquidityPosition;
}>;

export const UndelegateModal: UndelegateModalProps = ({ onClose, isOpen, liquidityPosition }) => {
  const [params] = useParams<PositionPageSchemaType>();
  const { collateralChange, setCollateralChange } = useContext(ManagePositionContext);
  const { network } = useNetwork();

  const queryClient = useQueryClient();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const toast = useToast({ isClosable: true, duration: 9000 });

  const [txSummary, setTxSummary] = useState({
    currentCollateral: ZEROWEI,
    collateralChange: ZEROWEI,
    currentDebt: ZEROWEI,
  });

  const currentCollateral = liquidityPosition?.collateralAmount || wei(0);

  const { exec: execUndelegate } = useUndelegate({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralTypeAddress: liquidityPosition?.tokenAddress,
    collateralChange,
    currentCollateral: currentCollateral,
  });

  const debtExists = liquidityPosition?.debt.gt(0);
  const currentDebt = debtExists && liquidityPosition ? liquidityPosition.debt : wei(0);
  const { data: USDC } = useUSDC();
  const { data: DebtRepayer } = useDebtRepayer();

  const { approve, requireApproval } = useApprove({
    contractAddress: USDC?.address,
    //slippage for approval
    amount: debtExists ? parseUnits(currentDebt.toString(), 6).mul(120).div(100) : 0,
    spender: DebtRepayer?.address,
  });

  const { exec: undelegateBaseAndromeda } = useUndelegateBaseAndromeda({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralTypeAddress: liquidityPosition?.tokenAddress,
    collateralChange,
    currentCollateral: currentCollateral,
    liquidityPosition,
  });

  const errorParser = useContractErrorParser();

  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const [state, send] = useMachine(UndelegateMachine, {
    context: {
      amount: collateralChange.abs(),
    },
    services: {
      [ServiceNames.undelegate]: async () => {
        try {
          setTxSummary({
            currentCollateral,
            currentDebt: liquidityPosition?.debt || ZEROWEI,
            collateralChange,
          });

          if (isBase) {
            if (requireApproval) {
              await approve(false);
            }
            await undelegateBaseAndromeda();
          } else {
            await execUndelegate();
          }

          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPosition'],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPositions'],
          });
          queryClient.invalidateQueries({
            queryKey: [
              `${network?.id}-${network?.preset}`,
              'AccountCollateralUnlockDate',
              { accountId: params.accountId },
            ],
          });

          setCollateralChange(ZEROWEI);

          toast.closeAll();
          toast({
            title: 'Success',
            description: 'Your locked collateral amount has been updated.',
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
            title: 'Unlock collateral failed',
            description: contractError ? (
              <ContractError contractError={contractError} />
            ) : (
              'Please try again.'
            ),
            status: 'error',
            variant: 'left-accent',
            duration: 3_600_000,
          });
          throw Error('Unlock collateral failed', { cause: error });
        }
      },
    },
  });

  const collateralChangeString = collateralChange.toString();

  useEffect(() => {
    send(Events.SET_AMOUNT, { amount: wei(collateralChangeString).abs() });
  }, [collateralChangeString, send]);

  useEffect(() => {
    send(Events.SET_COLLATERAL_SYMBOL, { symbol: wei(collateralChangeString).abs() });
  }, [collateralChangeString, send]);

  const onSubmit = useCallback(async () => {
    if (state.matches(State.success)) {
      send(Events.RESET);
      onClose();
      return;
    }
    if (state.context.error) {
      send(Events.RETRY);
      return;
    }
    send(Events.RUN);
  }, [onClose, send, state]);

  const txSummaryItems = useMemo(() => {
    const items = [
      {
        label: 'Locked ' + collateralType?.displaySymbol,
        value: (
          <ChangeStat
            value={txSummary.currentCollateral}
            newValue={txSummary.currentCollateral.add(txSummary.collateralChange)}
            formatFn={(val: Wei) => currency(val)}
            hasChanges={txSummary.collateralChange.abs().gt(0)}
            size="sm"
          />
        ),
      },
    ];

    if (isBase) {
      return items;
    }

    return [
      ...items,
      {
        label: 'C-ratio',
        value: (
          <CRatioChangeStat
            currentCollateral={txSummary.currentCollateral}
            currentDebt={txSummary.currentDebt}
            collateralChange={txSummary.collateralChange}
            collateralPrice={liquidityPosition?.collateralPrice ?? ZEROWEI}
            debtChange={ZEROWEI}
            size="sm"
          />
        ),
      },
    ];
  }, [
    collateralType?.displaySymbol,
    isBase,
    liquidityPosition?.collateralPrice,
    txSummary.collateralChange,
    txSummary.currentCollateral,
    txSummary.currentDebt,
  ]);

  return (
    <UndelegateModalUi
      amount={state.context.amount}
      isOpen={isOpen}
      onClose={onClose}
      collateralType={collateralType}
      state={state}
      error={state.context.error}
      onSubmit={onSubmit}
      txSummary={<TransactionSummary items={txSummaryItems} />}
    />
  );
};
