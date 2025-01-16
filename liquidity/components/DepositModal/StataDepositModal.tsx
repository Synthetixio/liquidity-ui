import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ChangeStat } from '@snx-v3/ChangeStat';
import { D18, D27, D6, ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { currency } from '@snx-v3/format';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useConvertStataUSDC } from '@snx-v3/useConvertStataUSDC';
import { useDepositBaseAndromeda } from '@snx-v3/useDepositBaseAndromeda';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useSynthToken } from '@snx-v3/useSynthToken';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useUSDC } from '@snx-v3/useUSDC';
import { Wei, wei } from '@synthetixio/wei';
import { useMachine } from '@xstate/react';
import { ethers } from 'ethers';
import React from 'react';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { TransactionSummary } from '../../ui/src/components/TransactionSummary/TransactionSummary';
import { DepositMachine, Events, ServiceNames, State } from './DepositMachine';

// const log = debug('snx:StataDepositModal');

export function StataDepositModal({
  onClose,
  title = 'Manage Collateral',
}: {
  onClose: () => void;
  title?: string;
}) {
  const [params, setParams] = useParams<PositionPageSchemaType>();
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
  // log('staticAaveUSDCRate', staticAaveUSDCRate, `${staticAaveUSDCRate}`);

  const { data: synthToken } = useSynthToken(collateralType);

  const { data: stataUSDCTokenBalanceRaw } = useTokenBalance(StaticAaveUSDC?.address);
  // log(
  //   'stataUSDCTokenBalanceRaw (6 decimals)',
  //   stataUSDCTokenBalanceRaw,
  //   `${stataUSDCTokenBalanceRaw}`
  // );
  const stataUSDCTokenBalance = stataUSDCTokenBalanceRaw
    ? stataUSDCTokenBalanceRaw.toBN()
    : ethers.BigNumber.from(0);
  // log('stataUSDCTokenBalance (6 decimals)', stataUSDCTokenBalance, `${stataUSDCTokenBalance}`);

  const [txSummary, setTxSummary] = React.useState({
    currentCollateral: ZEROWEI,
    collateralChange: ZEROWEI,
    currentDebt: ZEROWEI,
  });

  const synthNeeded: ethers.BigNumber = liquidityPosition
    ? collateralChange.sub(liquidityPosition.availableCollateral).toBN()
    : collateralChange.toBN();
  // log('synthNeeded (18 decimals)', synthNeeded, `${synthNeeded}`);

  const stataUSDCTokenBalanceD18: ethers.BigNumber = stataUSDCTokenBalance.div(D6).mul(D18);
  // log(
  //   'stataUSDCTokenBalanceD18 (18 decimals)',
  //   stataUSDCTokenBalanceD18,
  //   `${stataUSDCTokenBalanceD18}`
  // );

  const stataAmountNeeded: ethers.BigNumber =
    stataUSDCTokenBalance && synthNeeded.gt(stataUSDCTokenBalanceD18)
      ? synthNeeded.sub(stataUSDCTokenBalanceD18)
      : ethers.BigNumber.from(0);
  // log('stataAmountNeeded (18 decimals)', stataAmountNeeded, `${stataAmountNeeded}`);

  //Preparing stataUSDC
  const usdcBalanceNeeded: ethers.BigNumber = staticAaveUSDCRate
    ? stataAmountNeeded.mul(staticAaveUSDCRate).div(D27)
    : ethers.BigNumber.from(0);
  // log('usdcBalanceNeeded (18 decimals)', usdcBalanceNeeded, `${usdcBalanceNeeded}`);

  const { approve: approveUSDC, requireApproval: requireApprovalUSDC } = useApprove({
    contractAddress: USDC?.address,
    amount: usdcBalanceNeeded
      .mul(D6)
      .div(D18)

      // get extra 10%
      .mul(110)
      .div(100),
    spender: StaticAaveUSDC?.address,
  });
  // log('requireApprovalUSDC', requireApprovalUSDC);

  const { mutateAsync: wrapUSDCToStataUSDC } = useConvertStataUSDC({
    stataAmountNeeded,
    depositToAave: true,
  });
  //Preparing stataUSDC Done

  //Stata Approval
  const stataApprovalNeeded = liquidityPosition
    ? liquidityPosition.availableCollateral.lt(collateralChange)
      ? collateralChange.sub(liquidityPosition.availableCollateral)
      : wei(0)
    : collateralChange;
  const { approve: approveStata, requireApproval: requireApprovalStata } = useApprove({
    contractAddress: synthToken?.token?.address,
    amount:
      synthToken && synthToken.token
        ? stataApprovalNeeded
            .toBN()
            .mul(ethers.utils.parseUnits('1', synthToken.token.decimals))
            .div(D18)

            // extra 1% approval
            .mul(101)
            .div(100)
        : undefined,
    spender: SpotMarketProxy?.address,
  });
  // log('requireApprovalStata', requireApprovalStata);
  //Stata Approval Done

  //Deposit
  const newAccountId = React.useMemo(() => `${Math.floor(Math.random() * 1000000000000)}`, []);
  const { exec: depositBaseAndromeda } = useDepositBaseAndromeda({
    accountId: params.accountId,
    newAccountId,
    collateralTypeAddress: synthToken?.token?.address,
    collateralChange,
    currentCollateral: liquidityPosition ? liquidityPosition.collateralAmount : wei(0),
    availableCollateral: liquidityPosition ? liquidityPosition.availableCollateral : wei(0),
    collateralSymbol: params.collateralSymbol,
  });
  //Deposit done

  const toast = useToast({ isClosable: true, duration: 9000 });

  const errorParser = useContractErrorParser();

  const [state, send] = useMachine(DepositMachine, {
    services: {
      [ServiceNames.approveUSDCForStata]: async () => {
        try {
          // If less than 0.0001 no need for wrapping
          if (!requireApprovalUSDC) {
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
            duration: 3_600_000,
          });
          throw Error('Approve failed', { cause: error });
        }
      },

      [ServiceNames.wrapUSDCToStataUSDC]: async () => {
        try {
          toast({
            title: 'Wrapping USDC to StataUSDC',
            status: 'info',
            variant: 'left-accent',
          });
          await wrapUSDCToStataUSDC();
        } catch (error) {
          const contractError = errorParser(error);
          if (contractError) {
            console.error(new Error(contractError.name), contractError);
          }
          toast.closeAll();
          toast({
            title: 'Wrap USDC to Static aUSDC failed',
            description: contractError ? (
              <ContractError contractError={contractError} />
            ) : (
              'Please try again.'
            ),
            status: 'error',
            variant: 'left-accent',
            duration: 3_600_000,
          });
          throw Error('Wrap USDC failed', { cause: error });
        }
      },

      [ServiceNames.approveCollateral]: async () => {
        try {
          if (!requireApprovalStata) {
            return;
          }
          toast({
            title: `Approve collateral for transfer`,
            description: `Approve ${synthToken?.token?.address} transfer`,
            status: 'info',
            variant: 'left-accent',
          });

          await approveStata(Boolean(state.context.infiniteApproval));
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
            currentCollateral: liquidityPosition ? liquidityPosition.collateralAmount : wei(0),
            currentDebt: liquidityPosition ? liquidityPosition.debt : wei(0),
            collateralChange,
          });

          await depositBaseAndromeda();

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
    send(Events.SET_REQUIRE_APPROVAL, { requireApproval: requireApprovalStata });
  }, [requireApprovalStata, send]);

  const hasEnoughStataUSDCBalance = stataUSDCTokenBalance?.gte(synthNeeded);
  React.useEffect(() => {
    send(Events.SET_HAS_ENOUGH_STATAUSDC, { hasEnoughStataUSDC: hasEnoughStataUSDCBalance });
  }, [hasEnoughStataUSDCBalance, send]);

  React.useEffect(() => {
    send(Events.SET_REQUIRE_APPROVAL_FOR_STATAUSDC, {
      requireStataUSDCApproval: requireApprovalUSDC,
    });
  }, [requireApprovalUSDC, send]);

  React.useEffect(() => {
    send(Events.SET_IS_STATA_USDC, {
      isStataUSDC: true,
    });
  }, [send]);

  const handleClose = React.useCallback(() => {
    const isSuccess = state.matches(State.success);

    if (isSuccess && params.accountId && collateralType?.symbol) {
      send(Events.RESET);
      onClose();
      setParams({
        page: 'position',
        collateralSymbol: collateralType.symbol,
        manageAction: 'deposit',
        accountId: params.accountId,
      });
      return;
    }
    send(Events.RESET);
    onClose();
  }, [state, params.accountId, collateralType?.symbol, send, onClose, setParams]);

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

  const isProcessing =
    state.matches(State.approveCollateral) ||
    state.matches(State.deposit) ||
    state.matches(State.wrap);

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
              {
                label: `Locked ${collateralType?.displaySymbol ?? params.collateralSymbol}`,
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
            success: !requireApprovalUSDC || state.matches(State.success),
            loading: state.matches(State.approveUSDCForStata) && !state.context.error,
          }}
          checkboxLabel={requireApprovalUSDC ? `Approve unlimited USDC` : undefined}
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
              hasEnoughStataUSDCBalance ||
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
              suffix={` Static aUSDC.`}
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
