import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { currency, parseUnits } from '@snx-v3/format';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useConvertStataUSDC } from '@snx-v3/useConvertStataUSDC';
import { useDepositBaseAndromeda } from '@snx-v3/useDepositBaseAndromeda';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePool } from '@snx-v3/usePools';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useUSDC } from '@snx-v3/useUSDC';
import { Wei, wei } from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import { useMachine } from '@xstate/react';
import React from 'react';
import { ChangeStat } from '../../ui/src/components/ChangeStat/ChangeStat';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { TransactionSummary } from '../../ui/src/components/TransactionSummary/TransactionSummary';
import { DepositMachine, Events, ServiceNames, State } from './DepositMachine';

export function StataDepositModal({
  onClose,
  title = 'Manage Collateral',
}: {
  onClose: () => void;
  title?: string;
}) {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  const queryClient = useQueryClient();
  const { network } = useNetwork();
  const { collateralChange, setCollateralChange } = React.useContext(ManagePositionContext);
  const { data: SpotMarketProxy } = useSpotMarketProxy();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: USDC } = useUSDC();
  const { data: StaticAaveUSDC } = useStaticAaveUSDC();
  const { data: staticAaveUSDCRate } = useStaticAaveUSDCRate();

  const { data: synthTokens } = useSynthTokens();
  const synth = synthTokens?.find(
    (synth) =>
      collateralType?.tokenAddress?.toLowerCase() === synth?.address?.toLowerCase() ||
      collateralType?.tokenAddress?.toLowerCase() === synth?.token?.address.toLowerCase()
  );

  const { data: stataUSDCTokenBalance, refetch: refetchStataUSDCBalance } = useTokenBalance(
    StaticAaveUSDC?.address
  );

  const currentCollateral = liquidityPosition?.collateralAmount ?? ZEROWEI;
  const availableCollateral = liquidityPosition?.availableCollateral ?? ZEROWEI;

  const [txSummary, setTxSummary] = React.useState({
    currentCollateral: ZEROWEI,
    collateralChange: ZEROWEI,
    currentDebt: ZEROWEI,
  });

  const synthNeeded = React.useMemo(() => {
    let amount = collateralChange.sub(availableCollateral);
    amount = wei(amount.toNumber().toFixed(6));
    return amount.lt(0) ? ZEROWEI : amount;
  }, [availableCollateral, collateralChange]);

  const collateralNeeded = React.useMemo(() => {
    const amount = synthNeeded.sub(stataUSDCTokenBalance || ZEROWEI);
    return amount.gt(0) ? amount : ZEROWEI;
  }, [stataUSDCTokenBalance, synthNeeded]);

  //Preparing stataUSDC
  const USDCAmountForStataUSDC = React.useMemo(() => {
    return parseUnits(collateralNeeded.mul(staticAaveUSDCRate).toNumber().toFixed(6), 6);
  }, [collateralNeeded, staticAaveUSDCRate]);

  const { approve: approveUSDC, requireApproval: requireUSDCApproval } = useApprove({
    contractAddress: USDC?.address,
    amount: USDCAmountForStataUSDC.mul(110).div(100).toString(),
    spender: StaticAaveUSDC?.address,
  });

  const { mutateAsync: wrapUSDCToStataUSDC } = useConvertStataUSDC({
    amount: USDCAmountForStataUSDC,
    depositToAave: true,
  });
  //Preparing stataUSDC Done

  //Collateral Approval
  const { approve, requireApproval } = useApprove({
    contractAddress: synth?.token?.address,
    amount: collateralChange.lte(availableCollateral)
      ? wei(0).toBN()
      : collateralChange.sub(availableCollateral).toBN(),
    spender: SpotMarketProxy?.address,
  });
  //Collateral Approval Done

  //Deposit
  const newAccountId = React.useMemo(() => `${Math.floor(Math.random() * 1000000000000)}`, []);
  const { exec: depositBaseAndromeda } = useDepositBaseAndromeda({
    accountId: params.accountId,
    newAccountId,
    poolId: params.poolId,
    collateralTypeAddress: synth?.token.address,
    collateralChange,
    currentCollateral,
    availableCollateral,
    collateralSymbol: params.collateralSymbol,
  });
  //Deposit done

  const toast = useToast({ isClosable: true, duration: 9000 });

  // TODO: Update logic on new account id

  const { data: pool } = usePool(params.poolId);

  const errorParser = useContractErrorParser();

  const [state, send] = useMachine(DepositMachine, {
    services: {
      [ServiceNames.approveUSDCForStata]: async () => {
        try {
          //If less than 0.0001 no need for wrapping
          if (!requireUSDCApproval || USDCAmountForStataUSDC.lte(1000)) {
            return;
          }

          toast({
            title: 'Approve USDC for transfer',
            description: 'Approve USDC so it can be wrapped',
            status: 'info',
            variant: 'left-accent',
          });

          await approveUSDC(false);
        } catch (error: any) {
          const contractError = errorParser(error);
          if (contractError) {
            console.error(new Error(contractError.name), contractError);
          }
          toast.closeAll();
          toast({
            title: 'Approval failed',
            description: contractError ? (
              <ContractError contractError={contractError} />
            ) : (
              'Please try again.'
            ),
            status: 'error',
            variant: 'left-accent',
          });
          throw Error('Approve failed', { cause: error });
        }
      },

      [ServiceNames.wrapUSDCToStataUSDC]: async () => {
        //If less than 0.0001 no need for wrapping
        if (USDCAmountForStataUSDC.lte(1000)) {
          return;
        }
        try {
          toast({
            title: 'Wrapping USDC to StataUSDC',
            status: 'info',
            variant: 'left-accent',
          });
          await wrapUSDCToStataUSDC();
          await refetchStataUSDCBalance();
        } catch (error) {
          const contractError = errorParser(error);
          if (contractError) {
            console.error(new Error(contractError.name), contractError);
          }
          toast.closeAll();
          toast({
            title: 'Wrap USDC to StataUSDC failed',
            description: contractError ? (
              <ContractError contractError={contractError} />
            ) : (
              'Please try again.'
            ),
            status: 'error',
            variant: 'left-accent',
          });
          throw Error('Wrap USDC failed', { cause: error });
        }
      },

      [ServiceNames.approveCollateral]: async () => {
        try {
          if (!requireApproval) {
            return;
          }
          toast({
            title: `Approve collateral for transfer`,
            description: `Approve ${synth?.token?.address} transfer`,
            status: 'info',
            variant: 'left-accent',
          });

          await approve(Boolean(state.context.infiniteApproval));
        } catch (error: any) {
          const contractError = errorParser(error);
          if (contractError) {
            console.error(new Error(contractError.name), contractError);
          }
          toast.closeAll();
          toast({
            title: 'Approval failed',
            description: contractError ? (
              <ContractError contractError={contractError} />
            ) : (
              'Please try again.'
            ),
            status: 'error',
            variant: 'left-accent',
            duration: 3_600_000,
          });
          throw Error('Approve failed', { cause: error });
        }
      },

      [ServiceNames.executeDeposit]: async () => {
        try {
          toast.closeAll();
          toast({
            title: Boolean(params.accountId)
              ? 'Locking your collateral'
              : 'Creating your account and locking your collateral',
            description: '',
            variant: 'left-accent',
          });

          setTxSummary({
            currentCollateral,
            currentDebt: liquidityPosition?.debt || ZEROWEI,
            collateralChange,
          });

          await depositBaseAndromeda();

          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
          });
          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPosition'],
          });
          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'TransferableSynthetix'],
          });
          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'Allowance'],
          });
          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPositions'],
          });
          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'Accounts'],
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
            title: 'Could not complete locking collateral',
            description: contractError ? (
              <ContractError contractError={contractError} />
            ) : (
              'Please try again.'
            ),
            status: 'error',
            variant: 'left-accent',
            duration: 3_600_000,
          });
          throw Error('Lock collateral failed', { cause: error });
        }
      },
    },
  });

  React.useEffect(() => {
    send(Events.SET_REQUIRE_APPROVAL, { requireApproval });
  }, [requireApproval, send]);

  const hasEnoughStataUSDCBalance = stataUSDCTokenBalance?.gte(synthNeeded);
  React.useEffect(() => {
    send(Events.SET_HAS_ENOUGH_STATAUSDC, { hasEnoughStataUSDC: hasEnoughStataUSDCBalance });
  }, [hasEnoughStataUSDCBalance, send]);

  React.useEffect(() => {
    send(Events.SET_REQUIRE_APPROVAL_FOR_STATAUSDC, {
      requireStataUSDCApproval: requireUSDCApproval,
    });
  }, [requireUSDCApproval, send]);

  React.useEffect(() => {
    send(Events.SET_IS_STATA_USDC, {
      isStataUSDC: true,
    });
  }, [send]);

  const handleClose = React.useCallback(() => {
    const isSuccess = state.matches(State.success);

    if (isSuccess && params.poolId && params.accountId && collateralType?.symbol) {
      send(Events.RESET);
      onClose();
      setParams({
        page: 'position',
        collateralSymbol: collateralType.symbol,
        poolId: params.poolId,
        manageAction: 'deposit',
        accountId: params.accountId,
      });
      return;
    }
    send(Events.RESET);
    onClose();
  }, [state, params.poolId, params.accountId, collateralType?.symbol, send, onClose, setParams]);

  const onSubmit = React.useCallback(async () => {
    if (state.matches(State.success)) {
      handleClose();
      return;
    }
    if (state.context.error) {
      send(Events.RETRY);
      return;
    }

    send(Events.RUN);
  }, [handleClose, send, state]);

  const poolName = pool?.name || '';
  const hasEnoughStataUSDC = hasEnoughStataUSDCBalance;
  const requireUSDCApprovalForStata = requireUSDCApproval;

  const isProcessing =
    state.matches(State.approveCollateral) ||
    state.matches(State.deposit) ||
    state.matches(State.wrap);

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
        summary={
          <TransactionSummary
            items={[
              {
                label: `Locked ${collateralType?.symbol}`,
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
            ]}
          />
        }
      />
    );
  }

  return (
    <div data-cy="deposit multistep">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon cursor="pointer" onClick={onClose} mr={2} />
        {title}
      </Text>
      <Divider my={4} />
      <>
        <Multistep
          step={1}
          title="Approve USDC transfer"
          status={{
            failed: state.context.error?.step === State.approveUSDCForStata,
            success: !requireUSDCApprovalForStata || state.matches(State.success),
            loading: state.matches(State.approveUSDCForStata) && !state.context.error,
          }}
          checkboxLabel={requireUSDCApprovalForStata ? `Approve unlimited USDC` : undefined}
          checkboxProps={{
            isChecked: state.context.infiniteApproval,
            onChange: (e) =>
              send(Events.SET_INFINITE_APPROVAL, { infiniteApproval: e.target.checked }),
          }}
        />
        <Multistep
          step={2}
          title="Wrap USDC into Static aUSDC"
          subtitle={<Text>This will wrap your USDC into Static aUSDC to be deposited</Text>}
          status={{
            failed: state.context.error?.step === State.wrapUSDC,
            disabled: state.matches(State.success) && state.context.requireApproval,
            success:
              hasEnoughStataUSDC ||
              state.matches(State.approveCollateral) ||
              state.matches(State.deposit) ||
              state.matches(State.success),
            loading: state.matches(State.wrapUSDC) && !state.context.error,
          }}
        />
        <Multistep
          step={3}
          title="Approve Static aUSDC transfer"
          subtitle={<Text>You must approve your Static aUSDC transfer before depositing.</Text>}
          status={{
            failed: state.context.error?.step === State.approveCollateral,
            disabled: state.matches(State.success) && state.context.requireApproval,
            success: !state.context.requireApproval || state.matches(State.success),
            loading: state.matches(State.approveCollateral) && !state.context.error,
          }}
        />
        <Multistep
          step={4}
          title="Deposit and Lock Static aUSDC"
          subtitle={
            <Amount
              prefix="This will deposit and lock "
              value={collateralChange}
              suffix={` Static aUSDC into ${poolName}.`}
            />
          }
          status={{
            failed: state.context.error?.step === State.deposit,
            disabled: state.matches(State.success) && state.context.requireApproval,
            success: state.matches(State.success),
            loading: state.matches(State.deposit) && !state.context.error,
          }}
        />
      </>

      <Button
        isDisabled={isProcessing}
        onClick={onSubmit}
        width="100%"
        mt="6"
        data-cy="deposit confirm button"
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
