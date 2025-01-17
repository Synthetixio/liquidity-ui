import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ChangeStat } from '@snx-v3/ChangeStat';
import { D18, D6, ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { currency } from '@snx-v3/format';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useUndelegate } from '@snx-v3/useUndelegate';
import { useUndelegateBaseAndromeda } from '@snx-v3/useUndelegateBaseAndromeda';
import { useUSDC } from '@snx-v3/useUSDC';
import { Wei, wei } from '@synthetixio/wei';
import { useMachine } from '@xstate/react';
import { ethers } from 'ethers';
import React from 'react';
import { CRatioChangeStat } from '../../ui/src/components/CRatioBar/CRatioChangeStat';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { TransactionSummary } from '../../ui/src/components/TransactionSummary/TransactionSummary';
import { Events, ServiceNames, State, UndelegateMachine } from './UndelegateMachine';

export function UndelegateModal({ onClose }: { onClose: () => void }) {
  const [params] = useParams<PositionPageSchemaType>();
  const { collateralChange, setCollateralChange } = React.useContext(ManagePositionContext);
  const { network } = useNetwork();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const toast = useToast({ isClosable: true, duration: 9000 });

  const [txSummary, setTxSummary] = React.useState({
    currentCollateral: ZEROWEI,
    collateralChange: ZEROWEI,
    currentDebt: ZEROWEI,
  });

  const currentCollateral = liquidityPosition?.collateralAmount || wei(0);

  const { exec: execUndelegate, isReady: isReadyUndelegate } = useUndelegate({
    undelegateAmount:
      collateralChange && collateralChange.lt(0) ? collateralChange.abs() : undefined,
  });

  // Andromeda debt repayment
  const { data: USDC } = useUSDC();
  const { data: DebtRepayer } = useDebtRepayer();
  const approveAndromedaUSDCAmount = React.useMemo(() => {
    if (network?.preset !== 'andromeda') {
      return ethers.BigNumber.from(0);
    }
    if (!liquidityPosition) {
      return undefined;
    }
    if (liquidityPosition.debt.lte(0)) {
      return ethers.BigNumber.from(0);
    }
    return liquidityPosition.debt.toBN().mul(D6).div(D18).mul(110).div(100);
  }, [liquidityPosition, network?.preset]);
  const {
    approve,
    requireApproval,
    isReady: isReadyApproveAndromedaUSDC,
  } = useApprove({
    contractAddress: USDC?.address,
    amount: approveAndromedaUSDCAmount,
    spender: DebtRepayer?.address,
  });
  const { exec: undelegateBaseAndromeda, isReady: isReadyUndelegateAndromeda } =
    useUndelegateBaseAndromeda({
      undelegateAmount:
        collateralChange && collateralChange.lt(0) ? collateralChange.abs() : undefined,
    });
  // End of Andromeda debt repayment

  const errorParser = useContractErrorParser();

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

          if (network?.preset === 'andromeda') {
            if (requireApproval) {
              await approve(false);
            }
            await undelegateBaseAndromeda();
          } else {
            await execUndelegate();
          }

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

  React.useEffect(() => {
    send(Events.SET_AMOUNT, { amount: wei(collateralChangeString).abs() });
  }, [collateralChangeString, send]);

  React.useEffect(() => {
    send(Events.SET_COLLATERAL_SYMBOL, { symbol: wei(collateralChangeString).abs() });
  }, [collateralChangeString, send]);

  const onSubmit = React.useCallback(async () => {
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

  const isProcessing = state.matches(State.undelegate);
  if (state.matches(State.success)) {
    return (
      <LiquidityPositionUpdated
        onClose={onSubmit}
        title="Collateral successfully updated"
        subline={
          <>
            Your <b>collateral</b> has been updated. To learn more, visit the{' '}
            <Link href="https://docs.synthetix.io/" target="_blank" color="cyan.500">
              Synthetix V3 Documentation
            </Link>
          </>
        }
        alertText={
          <>
            <b>Collateral</b> successfully updated
          </>
        }
        summary={
          <TransactionSummary
            items={[
              ...(liquidityPosition
                ? [
                    {
                      label: 'Locked ' + collateralType?.displaySymbol,
                      value: (
                        <ChangeStat
                          value={txSummary.currentCollateral}
                          newValue={txSummary.currentCollateral.add(txSummary.collateralChange)}
                          formatFn={(val?: Wei) => currency(val ?? ZEROWEI)}
                          hasChanges={txSummary.collateralChange.abs().gt(0)}
                          size="sm"
                        />
                      ),
                    },
                  ]
                : []),
              ...(liquidityPosition && network?.preset !== 'andromeda'
                ? [
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
                  ]
                : []),
            ]}
          />
        }
      />
    );
  }

  const isReady =
    !isProcessing &&
    ((network?.preset === 'andromeda' &&
      isReadyApproveAndromedaUSDC &&
      isReadyUndelegateAndromeda) ||
      (network?.preset !== 'andromeda' && isReadyUndelegate));

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
            value={state.context.amount}
            suffix={` ${collateralType?.displaySymbol} will be unlocked from the pool.`}
          />
        }
        status={{
          failed: Boolean(state.context.error?.step === State.undelegate),
          disabled: state.context.amount.eq(0),
          success: state.matches(State.success),
          loading: state.matches(State.undelegate) && !state.context.error,
        }}
      />

      <Button
        isDisabled={!isReady}
        onClick={onSubmit}
        width="100%"
        mt="6"
        data-cy="undelegate confirm button"
      >
        {(() => {
          switch (true) {
            case Boolean(state.context.error):
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
