import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { currency } from '@snx-v3/format';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useDeposit } from '@snx-v3/useDeposit';
import { useDepositBaseAndromeda } from '@snx-v3/useDepositBaseAndromeda';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePool } from '@snx-v3/usePools';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useWrapEth } from '@snx-v3/useWrapEth';
import { Wei, wei } from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import { useMachine } from '@xstate/react';
import React from 'react';
import { ChangeStat } from '../../ui/src/components/ChangeStat/ChangeStat';
import { CRatioChangeStat } from '../../ui/src/components/CRatioBar/CRatioChangeStat';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { TransactionSummary } from '../../ui/src/components/TransactionSummary/TransactionSummary';
import { DepositMachine, Events, ServiceNames, State } from './DepositMachine';
import { ethers } from 'ethers';

export function DepositModal({
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
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: synthTokens } = useSynthTokens();
  const synth = synthTokens?.find(
    (synth) =>
      collateralType?.tokenAddress?.toLowerCase() === synth?.address?.toLowerCase() ||
      collateralType?.tokenAddress?.toLowerCase() === synth?.token?.address.toLowerCase()
  );

  const currentCollateral = liquidityPosition?.collateralAmount ?? ZEROWEI;
  const availableCollateral = liquidityPosition?.availableCollateral ?? ZEROWEI;

  const [txSummary, setTxSummary] = React.useState({
    currentCollateral: ZEROWEI,
    collateralChange: ZEROWEI,
    currentDebt: ZEROWEI,
  });

  const synthNeeded = React.useMemo(() => {
    const amount = collateralChange.sub(availableCollateral);
    return amount.lt(0) ? ZEROWEI : amount;
  }, [availableCollateral, collateralChange]);

  const collateralNeeded = React.useMemo(() => {
    const amount = synthNeeded;
    return amount.gt(0) ? amount : ZEROWEI;
  }, [synthNeeded]);

  //Preparing wETH
  const { exec: wrapEth, wethBalance } = useWrapEth();
  const wrapETHAmount =
    collateralType?.symbol === 'WETH' && collateralNeeded.gt(wethBalance || 0)
      ? collateralNeeded.sub(wethBalance || 0)
      : ZEROWEI;
  //Preparing wETH done

  //Collateral Approval
  const { approve, requireApproval } = useApprove({
    contractAddress:
      network?.preset === 'andromeda' ? synth?.token?.address : collateralType?.tokenAddress,
    amount: collateralChange.lte(availableCollateral)
      ? wei(0).toBN()
      : network?.preset === 'andromeda'
        ? ethers.utils.parseUnits(
            collateralChange.sub(availableCollateral).toString(),
            synth?.token.decimals
          )
        : collateralChange.sub(availableCollateral).toBN(),
    spender: network?.preset === 'andromeda' ? SpotMarketProxy?.address : CoreProxy?.address,
  });
  //Collateral Approval Done

  //Deposit
  const newAccountId = React.useMemo(() => `${Math.floor(Math.random() * 1000000000000)}`, []);
  const { exec: execDeposit } = useDeposit({
    accountId: params.accountId,
    newAccountId,
    poolId: params.poolId,
    collateralTypeAddress: collateralType?.tokenAddress,
    collateralChange,
    currentCollateral,
    availableCollateral,
  });
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
      [ServiceNames.wrapEth]: async () => {
        try {
          await wrapEth(state.context.wrapAmount);
        } catch (error: any) {
          const contractError = errorParser(error);
          if (contractError) {
            console.error(new Error(contractError.name), contractError);
          }

          toast.closeAll();
          toast({
            title: 'Wrapping ETH failed',
            description: contractError ? (
              <ContractError contractError={contractError} />
            ) : (
              error.message || 'Please try again.'
            ),
            status: 'error',
            variant: 'left-accent',
            duration: 3_600_000,
          });
          throw Error('Wrapping failed', { cause: error });
        }
      },

      [ServiceNames.approveCollateral]: async () => {
        try {
          if (!requireApproval) {
            return;
          }
          toast({
            title: `Approve collateral for transfer`,
            description: `Approve ${
              network?.preset === 'andromeda' ? synth?.token?.address : collateralType?.tokenAddress
            } transfer`,
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

          if (network?.preset === 'andromeda') {
            await depositBaseAndromeda();
          } else {
            await execDeposit();
          }

          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
          });
          queryClient.invalidateQueries({
            queryKey: [`${network?.id}-${network?.preset}`, 'EthBalance'],
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

  const wrapAmountString = wrapETHAmount.toString();
  const isSuccessOrDeposit = state.matches(State.success) || state.matches(State.deposit);
  React.useEffect(() => {
    if (isSuccessOrDeposit) {
      // We do this to ensure the success state displays the wrap amount used before deposit
      return;
    }
    send(Events.SET_WRAP_AMOUNT, { wrapAmount: wei(wrapAmountString || '0') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessOrDeposit, wrapAmountString]);

  React.useEffect(() => {
    send(Events.SET_REQUIRE_APPROVAL, { requireApproval });
  }, [requireApproval, send]);

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

  const txSummaryItems = React.useMemo(() => {
    const items = [
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
    ];

    if (network?.preset === 'andromeda') {
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
    collateralType?.symbol,
    network?.preset,
    liquidityPosition?.collateralPrice,
    txSummary.collateralChange,
    txSummary.currentCollateral,
    txSummary.currentDebt,
  ]);

  const poolName = pool?.name || '';
  const symbol = collateralType?.displaySymbol;

  const isProcessing =
    state.matches(State.approveCollateral) ||
    state.matches(State.deposit) ||
    state.matches(State.wrap);

  const isWETH = collateralType?.symbol === 'WETH';

  const stepNumbers = {
    wrap: isWETH ? 1 : 0,
    approve: isWETH ? 2 : 1,
    deposit: isWETH ? 3 : 2,
  };

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
        summary={<TransactionSummary items={txSummaryItems} />}
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
      {isWETH ? (
        <Multistep
          step={stepNumbers.wrap}
          title="Wrap"
          subtitle={
            state.context.wrapAmount.eq(0) ? (
              <Text as="div">
                <Amount value={collateralChange} suffix={` ${collateralType?.symbol}`} /> from
                balance will be used.
              </Text>
            ) : (
              <Text as="div">
                You must wrap additional <Amount value={state.context.wrapAmount} suffix=" ETH" />{' '}
                before depositing.
              </Text>
            )
          }
          status={{
            failed: state.context.error?.step === State.wrap,
            disabled: collateralType?.symbol !== 'WETH',
            success: state.context.wrapAmount.eq(0) || state.matches(State.success),
            loading: state.matches(State.wrap) && !state.context.error,
          }}
        />
      ) : null}

      <Multistep
        step={stepNumbers.approve}
        title={`Approve ${symbol} transfer`}
        status={{
          failed: state.context.error?.step === State.approveCollateral,
          success: !state.context.requireApproval || state.matches(State.success),
          loading: state.matches(State.approveCollateral) && !state.context.error,
        }}
        checkboxLabel={
          state.context.requireApproval
            ? `Approve unlimited ${symbol} transfers to Synthetix`
            : undefined
        }
        checkboxProps={{
          isChecked: state.context.infiniteApproval,
          onChange: (e) =>
            send(Events.SET_INFINITE_APPROVAL, { infiniteApproval: e.target.checked }),
        }}
      />
      <Multistep
        step={stepNumbers.deposit}
        title={`Deposit and Lock ${symbol}`}
        subtitle={
          <>
            {state.matches(State.success) ? (
              <Amount
                value={collateralChange}
                suffix={` ${collateralType?.symbol} deposited and locked into ${poolName}.`}
              />
            ) : (
              <>
                {availableCollateral && availableCollateral.gt(ZEROWEI) ? (
                  <>
                    {availableCollateral.gte(collateralChange) ? (
                      <Amount
                        prefix={`This will deposit and lock `}
                        value={collateralChange}
                        suffix={` ${collateralType?.symbol} into ${poolName}.`}
                      />
                    ) : (
                      <>
                        <Text>
                          <Amount
                            prefix={`This will deposit and lock `}
                            value={availableCollateral}
                            suffix={` ${collateralType?.symbol} into ${poolName}.`}
                          />
                        </Text>
                        <Text>
                          <Amount
                            prefix={`An additional `}
                            value={collateralChange.sub(availableCollateral)}
                            suffix={` ${collateralType?.symbol} will be deposited and locked from your wallet.`}
                          />
                        </Text>
                      </>
                    )}
                  </>
                ) : (
                  <Amount
                    prefix={`This will deposit and lock `}
                    value={collateralChange}
                    suffix={` ${collateralType?.symbol} into ${poolName}.`}
                  />
                )}
              </>
            )}
          </>
        }
        status={{
          failed: state.context.error?.step === State.deposit,
          disabled: state.matches(State.success) && state.context.requireApproval,
          success: state.matches(State.success),
          loading: state.matches(State.deposit) && !state.context.error,
        }}
      />
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
