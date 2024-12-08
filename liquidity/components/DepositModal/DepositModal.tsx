import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ONEWEI, ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { currency, parseUnits } from '@snx-v3/format';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { Network, useNetwork } from '@snx-v3/useBlockchain';
import { CollateralType, useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useConvertStataUSDC } from '@snx-v3/useConvertStataUSDC';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useDeposit } from '@snx-v3/useDeposit';
import { useDepositBaseAndromeda } from '@snx-v3/useDepositBaseAndromeda';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePool } from '@snx-v3/usePools';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useUSDC } from '@snx-v3/useUSDC';
import { useWrapEth } from '@snx-v3/useWrapEth';
import { Wei, wei } from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import { useMachine } from '@xstate/react';
import { ethers } from 'ethers';
import React from 'react';
import type { StateFrom } from 'xstate';
import { ChangeStat } from '../../ui/src/components/ChangeStat/ChangeStat';
import { CRatioChangeStat } from '../../ui/src/components/CRatioBar/CRatioChangeStat';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { TransactionSummary } from '../../ui/src/components/TransactionSummary/TransactionSummary';
import { DepositMachine, Events, ServiceNames, State } from './DepositMachine';

export function DepositModalUi({
  collateralChange,
  isOpen,
  onClose,
  collateralType,
  setInfiniteApproval,
  onSubmit,
  state,
  availableCollateral,
  poolName,
  title = 'Manage Collateral',
  txSummary,
  hasEnoughStataUSDC,
  requireUSDCApprovalForStata,
  network,
  symbol,
}: {
  collateralChange: Wei;
  isOpen: boolean;
  onClose: () => void;
  collateralType?: CollateralType;
  state: StateFrom<typeof DepositMachine>;
  setInfiniteApproval: (x: boolean) => void;
  onSubmit: () => void;
  availableCollateral: Wei;
  poolName: string;
  title?: string;
  txSummary?: React.ReactNode;
  hasEnoughStataUSDC?: boolean;
  requireUSDCApprovalForStata?: boolean;
  network?: Network;
  symbol?: string;
}) {
  const wrapAmount = state.context.wrapAmount;
  const infiniteApproval = state.context.infiniteApproval;
  const requireApproval = state.context.requireApproval;
  const error = state.context.error;
  const isProcessing =
    state.matches(State.approveCollateral) ||
    state.matches(State.deposit) ||
    state.matches(State.wrap);

  const isWETH = collateralType?.symbol === 'WETH';

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  const stepNumbers = {
    wrap: isWETH ? 1 : 0,
    approve: isWETH ? 2 : 1,
    deposit: isWETH ? 3 : 2,
  };

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
              wrapAmount.eq(0) ? (
                <Text as="div">
                  <Amount value={collateralChange} suffix={` ${collateralType?.symbol}`} /> from
                  balance will be used.
                </Text>
              ) : (
                <Text as="div">
                  You must wrap additional <Amount value={wrapAmount} suffix=" ETH" /> before
                  depositing.
                </Text>
              )
            }
            status={{
              failed: error?.step === State.wrap,
              disabled: collateralType?.symbol !== 'WETH',
              success: wrapAmount.eq(0) || state.matches(State.success),
              loading: state.matches(State.wrap) && !error,
            }}
          />
        ) : null}

        {isStataUSDC ? (
          <>
            <Multistep
              step={1}
              title="Approve USDC transfer"
              status={{
                failed: error?.step === State.approveUSDCForStata,
                success: !requireUSDCApprovalForStata || state.matches(State.success),
                loading: state.matches(State.approveUSDCForStata) && !error,
              }}
              checkboxLabel={requireUSDCApprovalForStata ? `Approve unlimited USDC` : undefined}
              checkboxProps={{
                isChecked: infiniteApproval,
                onChange: (e) => setInfiniteApproval(e.target.checked),
              }}
            />
            <Multistep
              step={2}
              title="Wrap USDC into Static aUSDC"
              subtitle={<Text>This will wrap your USDC into Static aUSDC to be deposited</Text>}
              status={{
                failed: error?.step === State.wrapUSDC,
                disabled: state.matches(State.success) && requireApproval,
                success:
                  hasEnoughStataUSDC ||
                  state.matches(State.approveCollateral) ||
                  state.matches(State.deposit) ||
                  state.matches(State.success),
                loading: state.matches(State.wrapUSDC) && !error,
              }}
            />
            <Multistep
              step={3}
              title="Approve Static aUSDC transfer"
              subtitle={<Text>You must approve your Static aUSDC transfer before depositing.</Text>}
              status={{
                failed: error?.step === State.approveCollateral,
                disabled: state.matches(State.success) && requireApproval,
                success: !requireApproval || state.matches(State.success),
                loading: state.matches(State.approveCollateral) && !error,
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
                failed: error?.step === State.deposit,
                disabled: state.matches(State.success) && requireApproval,
                success: state.matches(State.success),
                loading: state.matches(State.deposit) && !error,
              }}
            />
          </>
        ) : (
          <>
            <Multistep
              step={stepNumbers.approve}
              title={`Approve ${symbol} transfer`}
              status={{
                failed: error?.step === State.approveCollateral,
                success: !requireApproval || state.matches(State.success),
                loading: state.matches(State.approveCollateral) && !error,
              }}
              checkboxLabel={
                requireApproval ? `Approve unlimited ${symbol} transfers to Synthetix` : undefined
              }
              checkboxProps={{
                isChecked: infiniteApproval,
                onChange: (e) => setInfiniteApproval(e.target.checked),
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
                failed: error?.step === State.deposit,
                disabled: state.matches(State.success) && requireApproval,
                success: state.matches(State.success),
                loading: state.matches(State.deposit) && !error,
              }}
            />
          </>
        )}
        <Button
          isDisabled={isProcessing}
          onClick={onSubmit}
          width="100%"
          mt="6"
          data-cy="deposit confirm button"
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
}

export function DepositModal({
  onClose,
  isOpen,
  title,
  liquidityPosition,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  liquidityPosition?: LiquidityPosition;
}) {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  const queryClient = useQueryClient();
  const { network } = useNetwork();
  const { collateralChange, setCollateralChange } = React.useContext(ManagePositionContext);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: collateralTypes } = useCollateralTypes();

  const collateralType = collateralTypes?.filter(
    (collateral) =>
      collateral.tokenAddress.toLowerCase() === liquidityPosition?.tokenAddress.toLowerCase()
  )[0];
  const isBase = isBaseAndromeda(network?.id, network?.preset);

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  const { data: USDC } = useUSDC();
  const { data: StaticAaveUSDC } = useStaticAaveUSDC();
  const { data: staticAaveUSDCRate } = useStaticAaveUSDCRate();

  const { data: synthTokens } = useSynthTokens(network);
  const synth = synthTokens?.find(
    (synth) =>
      collateralType?.tokenAddress?.toLowerCase() === synth?.address?.toLowerCase() ||
      collateralType?.tokenAddress?.toLowerCase() === synth?.token?.address.toLowerCase()
  );

  const { data: stataUSDCTokenBalance, refetch: refetchStataUSDCBalance } = useTokenBalance(
    StaticAaveUSDC?.address
  );

  const currentCollateral = liquidityPosition?.collateralAmount ?? ZEROWEI;
  const availableCollateral = liquidityPosition?.accountCollateral.availableCollateral ?? ZEROWEI;

  const [txSummary, setTxSummary] = React.useState({
    currentCollateral: ZEROWEI,
    collateralChange: ZEROWEI,
    currentDebt: ZEROWEI,
  });

  const collateralRate = React.useMemo(() => {
    if (isBase && isStataUSDC) {
      return staticAaveUSDCRate || ZEROWEI;
    } else {
      return ONEWEI;
    }
  }, [isBase, isStataUSDC, staticAaveUSDCRate]);

  const synthNeeded = React.useMemo(() => {
    let amount = collateralChange.sub(availableCollateral);
    if (isStataUSDC) {
      amount = wei(amount.toNumber().toFixed(6));
    }
    return amount.lt(0) ? ZEROWEI : amount;
  }, [availableCollateral, collateralChange, isStataUSDC]);

  const collateralNeeded = React.useMemo(() => {
    let amount = synthNeeded;
    if (isBase && isStataUSDC) {
      amount = synthNeeded.sub(stataUSDCTokenBalance || ZEROWEI);
    }
    return amount.gt(0) ? amount : ZEROWEI;
  }, [isBase, isStataUSDC, stataUSDCTokenBalance, synthNeeded]);

  //Preparing wETH
  const { exec: wrapEth, wethBalance } = useWrapEth();
  const wrapETHAmount =
    collateralType?.symbol === 'WETH' && collateralNeeded.gt(wethBalance || 0)
      ? collateralNeeded.sub(wethBalance || 0)
      : ZEROWEI;
  //Preparing wETH done

  //Preparing stataUSDC
  const USDCAmountForStataUSDC = React.useMemo(() => {
    if (isBase && isStataUSDC) {
      return parseUnits(collateralNeeded.mul(collateralRate).toNumber().toFixed(6), 6);
    }
    return ethers.BigNumber.from(0);
  }, [collateralNeeded, collateralRate, isBase, isStataUSDC]);

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
  const amountToApprove = React.useMemo(() => {
    if (collateralChange.sub(availableCollateral).lte(0)) {
      return 0;
    }
    return parseUnits(collateralChange.sub(availableCollateral), synth?.token.decimals);
  }, [availableCollateral, collateralChange, synth?.token.decimals]);
  const { approve, requireApproval } = useApprove({
    contractAddress: isBase ? synth?.token?.address : collateralType?.tokenAddress,
    amount: amountToApprove,
    spender: isBase ? SpotMarketProxy?.address : CoreProxy?.address,
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
    availableCollateral: availableCollateral || ZEROWEI,
    decimals: Number(collateralType?.decimals) || 18,
  });
  const { exec: depositBaseAndromeda } = useDepositBaseAndromeda({
    accountId: params.accountId,
    newAccountId,
    poolId: params.poolId,
    collateralTypeAddress: synth?.token.address,
    collateralChange,
    currentCollateral,
    availableCollateral: availableCollateral || ZEROWEI,
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

      [ServiceNames.approveUSDCForStata]: async () => {
        try {
          if (!requireUSDCApproval || USDCAmountForStataUSDC.lte(1000) || !isStataUSDC) {
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
        if (USDCAmountForStataUSDC.lte(1000) || !isStataUSDC) {
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
            description: `Approve ${synth?.token.symbol} transfer`,
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

          if (isBase) {
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
      isStataUSDC,
    });
  }, [isStataUSDC, send]);

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
    collateralType?.symbol,
    isBase,
    liquidityPosition?.collateralPrice,
    txSummary.collateralChange,
    txSummary.currentCollateral,
    txSummary.currentDebt,
  ]);

  return (
    <DepositModalUi
      collateralChange={collateralChange}
      isOpen={isOpen}
      onClose={onClose}
      collateralType={collateralType}
      state={state}
      setInfiniteApproval={(infiniteApproval) => {
        send(Events.SET_INFINITE_APPROVAL, { infiniteApproval });
      }}
      onSubmit={onSubmit}
      poolName={pool?.name || ''}
      availableCollateral={availableCollateral || ZEROWEI}
      title={title}
      txSummary={<TransactionSummary items={txSummaryItems} />}
      hasEnoughStataUSDC={hasEnoughStataUSDCBalance}
      requireUSDCApprovalForStata={requireUSDCApproval}
      network={network}
      symbol={collateralType?.displaySymbol}
    />
  );
}
