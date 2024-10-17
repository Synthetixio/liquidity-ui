import { Button, Divider, Text, useToast, Link } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ContractError } from '@snx-v3/ContractError';
import { getWrappedStataUSDCOnBase, isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { CollateralType, useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useDeposit } from '@snx-v3/useDeposit';
import { useDepositBaseAndromeda } from '@snx-v3/useDepositBaseAndromeda';
import { useParams } from '@snx-v3/useParams';
import { usePool } from '@snx-v3/usePools';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useWrapEth } from '@snx-v3/useWrapEth';
import { Wei, wei } from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import { useMachine } from '@xstate/react';
import { BigNumber } from 'ethers';
import { FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { generatePath, useLocation, useNavigate } from 'react-router-dom';
import type { StateFrom } from 'xstate';
import { DepositMachine, Events, ServiceNames, State } from './DepositMachine';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { ONEWEI, ZEROWEI } from '@snx-v3/constants';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { ChangeStat } from '../../ui/src/components/ChangeStat';
import { CRatioChangeStat } from '../../ui/src/components/CRatioBar/CRatioChangeStat';
import { TransactionSummary } from '../../ui/src/components/TransactionSummary/TransactionSummary';
import { currency, parseUnits } from '@snx-v3/format';
import { useConvertStataUSDC } from '@snx-v3/useConvertStataUSDC';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useUSDC } from '../../lib/useUSDC';
import { useSynthTokens } from '@snx-v3/useSynthTokens';

export const DepositModalUi: FC<{
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
  txSummary?: ReactNode;
  hasEnoughStataUSDC?: boolean;
  requireUSDCApprovalForStata?: boolean;
  networkId?: number;
  symbol?: string;
}> = ({
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
  networkId,
  symbol,
}) => {
  const wrapAmount = state.context.wrapAmount;
  const infiniteApproval = state.context.infiniteApproval;
  const requireApproval = state.context.requireApproval;
  const error = state.context.error;
  const isProcessing =
    state.matches(State.approveCollateral) ||
    state.matches(State.deposit) ||
    state.matches(State.wrap);

  const isWETH = collateralType?.symbol === 'WETH';
  const isStataUSDC =
    collateralType?.tokenAddress.toLowerCase() ===
    getWrappedStataUSDCOnBase(networkId).toLowerCase();

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
                success: hasEnoughStataUSDC || state.matches(State.success),
                loading: state.matches(State.wrapUSDC) && !error,
              }}
            />
            <Multistep
              step={3}
              title="Approve Static aUSDC transfer"
              subtitle={<Text>You must approve your Static aUSDC transfer before depositing.</Text>}
              status={{
                failed: error?.step === State.approveUSDCForStata,
                disabled: state.matches(State.success) && requireApproval,
                success: !requireApproval || state.matches(State.success),
                loading: state.matches(State.approveUSDCForStata) && !error,
              }}
            />
            <Multistep
              step={4}
              title="Deposit and Lock Static aUSDC"
              subtitle={
                <Text>
                  This will deposit and lock{' '}
                  <Amount value={collateralChange} suffix=" Static aUSDC" /> to {poolName}.
                </Text>
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
              title={`Approve ${symbol} to transfer`}
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
              title={`Deposit & Lock ${symbol}`}
              subtitle={
                <>
                  {state.matches(State.success) ? (
                    <Text>
                      <Amount value={collateralChange} suffix={` ${collateralType?.symbol}`} />{' '}
                      deposited & locked in {poolName}.
                    </Text>
                  ) : (
                    <>
                      {availableCollateral && availableCollateral.gt(ZEROWEI) ? (
                        <>
                          {availableCollateral.gte(collateralChange) ? (
                            <Text>
                              This will deposit & lock{' '}
                              <Amount
                                value={collateralChange}
                                suffix={` ${collateralType?.symbol}`}
                              />{' '}
                              in {poolName}.
                            </Text>
                          ) : (
                            <>
                              <Text>
                                This will deposit & lock{' '}
                                <Amount
                                  value={availableCollateral}
                                  suffix={` ${collateralType?.symbol}`}
                                />{' '}
                                to {poolName}.
                              </Text>
                              <Text>
                                An additional{' '}
                                <Amount
                                  value={collateralChange.sub(availableCollateral)}
                                  suffix={` ${collateralType?.symbol}`}
                                />{' '}
                                will be deposited and locked from your wallet.
                              </Text>
                            </>
                          )}
                        </>
                      ) : (
                        <Text>
                          This will deposit and lock{' '}
                          <Amount value={collateralChange} suffix={` ${collateralType?.symbol}`} />{' '}
                          to {poolName}.
                        </Text>
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
};

export type DepositModalProps = FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  liquidityPosition?: LiquidityPosition;
}>;

export const DepositModal: DepositModalProps = ({ onClose, isOpen, title, liquidityPosition }) => {
  const navigate = useNavigate();
  const { collateralSymbol, poolId, accountId } = useParams();
  const queryClient = useQueryClient();
  const { network } = useNetwork();
  const { collateralChange, setCollateralChange } = useContext(ManagePositionContext);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotProxy } = useSpotMarketProxy();
  const { data: collateralTypes } = useCollateralTypes();

  const collateral = collateralTypes?.filter(
    (collateral) =>
      collateral.tokenAddress.toLowerCase() === liquidityPosition?.tokenAddress.toLowerCase()
  )[0];
  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const isStataUSDC =
    collateral?.tokenAddress.toLowerCase() === getWrappedStataUSDCOnBase(network?.id).toLowerCase();

  const { data: USDC } = useUSDC();
  const { data: stataUSDC } = useStaticAaveUSDC();
  const { data: stataUSDCRate } = useStaticAaveUSDCRate();

  const { data: synthTokens } = useSynthTokens();
  const synth = synthTokens?.find(
    (synth) => synth.address.toLowerCase() === collateral?.tokenAddress.toLowerCase()
  );
  const { data: synthBalance } = useTokenBalance(collateral?.tokenAddress);
  const { data: stataUSDCTokenBalance, refetch: refetchStataUSDCBalance } = useTokenBalance(
    stataUSDC?.address
  );

  const currentCollateral = liquidityPosition?.collateralAmount ?? ZEROWEI;
  const availableCollateral = liquidityPosition?.accountCollateral.availableCollateral ?? ZEROWEI;

  const [txSummary, setTxSummary] = useState({
    currentCollateral: ZEROWEI,
    collateralChange: ZEROWEI,
    currentDebt: ZEROWEI,
  });

  const collateralRate = useMemo(() => {
    if (isBase && isStataUSDC) {
      return stataUSDCRate;
    } else {
      return ONEWEI;
    }
  }, [isBase, isStataUSDC, stataUSDCRate]);

  const depositAmount = useMemo(
    () => collateralChange.div(collateralRate),
    [collateralChange, collateralRate]
  );

  const synthNeeded = useMemo(() => {
    let amount = depositAmount.sub(availableCollateral).sub(synthBalance || ZEROWEI);
    if (isStataUSDC) {
      amount = wei(amount.toNumber().toFixed(6));
    }
    return amount.lt(0) ? ZEROWEI : amount;
  }, [availableCollateral, depositAmount, isStataUSDC, synthBalance]);

  const collateralNeeded = useMemo(() => {
    if (isBase && isStataUSDC) {
      return synthNeeded.sub(stataUSDCTokenBalance || ZEROWEI);
    }
    return synthNeeded;
  }, [isBase, isStataUSDC, stataUSDCTokenBalance, synthNeeded]);

  //Preparing wETH
  const { exec: wrapEth, wethBalance } = useWrapEth();
  const wrapETHAmount =
    collateral?.symbol === 'WETH' && collateralNeeded.gt(wethBalance || 0)
      ? collateralNeeded.sub(wethBalance || 0)
      : ZEROWEI;
  //Preparing wETH done

  //Preparing stataUSDC
  const USDCAmountForStataUSDC = useMemo(() => {
    if (isBase && isStataUSDC) {
      return parseUnits(collateralNeeded.mul(collateralRate).toNumber().toFixed(6), 6);
    }
    return BigNumber.from(0);
  }, [collateralNeeded, collateralRate, isBase, isStataUSDC]);

  const { approve: approveUSDC, requireApproval: requireUSDCApproval } = useApprove({
    contractAddress: USDC?.address,
    amount: USDCAmountForStataUSDC,
    spender: stataUSDC?.address,
  });

  const { mutateAsync: wrapUSDCToStataUSDC } = useConvertStataUSDC({
    amount: USDCAmountForStataUSDC,
    depositToAave: true,
  });
  //Preparing stataUSDC Done

  //Collateral Approval
  const amountToApprove = useMemo(() => {
    if (collateralNeeded.lte(0)) {
      return 0;
    }
    return parseUnits(collateralNeeded, synth?.token.decimals);
  }, [collateralNeeded, synth?.token.decimals]);
  const { approve, requireApproval } = useApprove({
    contractAddress: synth?.token.address,
    amount: amountToApprove,
    spender: isBase ? SpotProxy?.address : CoreProxy?.address,
  });
  //Collateral Approval Done

  //Deposit
  const newAccountId = useMemo(() => `${Math.floor(Math.random() * 1000000000000)}`, []);
  const { exec: execDeposit } = useDeposit({
    accountId: accountId,
    newAccountId,
    poolId: poolId,
    collateralTypeAddress: synth?.token.address,
    collateralChange: collateralChange,
    currentCollateral,
    availableCollateral: availableCollateral || ZEROWEI,
    decimals: Number(collateral?.decimals) || 18,
  });
  const { exec: depositBaseAndromeda } = useDepositBaseAndromeda({
    accountId,
    newAccountId,
    poolId,
    collateralTypeAddress: synth?.token.address,
    collateralChange: depositAmount,
    currentCollateral,
    availableCollateral: availableCollateral || ZEROWEI,
    collateralSymbol,
  });
  //Deposit done

  const toast = useToast({ isClosable: true, duration: 9000 });

  // TODO: Update logic on new account id

  const { data: pool } = usePool(poolId);

  const errorParserCoreProxy = useContractErrorParser(CoreProxy);

  const [state, send] = useMachine(DepositMachine, {
    services: {
      [ServiceNames.wrapEth]: async () => {
        try {
          await wrapEth(state.context.wrapAmount);
        } catch (error: any) {
          const contractError = errorParserCoreProxy(error);
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
          });
          throw Error('Wrapping failed', { cause: error });
        }
      },

      [ServiceNames.approveUSDCForStata]: async () => {
        try {
          if (!requireUSDCApproval) {
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
          const contractError = errorParserCoreProxy(error);
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
        if (USDCAmountForStataUSDC.lte(0) || !isStataUSDC) {
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
          toast.closeAll();
          toast({
            title: 'Wrap USDC to StataUSDC failed',
            description: 'Please try again.',
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
          const contractError = errorParserCoreProxy(error);
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

      [ServiceNames.executeDeposit]: async () => {
        try {
          toast.closeAll();
          toast({
            title: Boolean(accountId)
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

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: [`${network?.id}-${network?.preset}`, 'EthBalance'],
            }),
            queryClient.invalidateQueries({
              queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPosition'],
            }),
            collateral?.symbol === 'SNX'
              ? queryClient.invalidateQueries({
                  queryKey: [`${network?.id}-${network?.preset}`, 'TransferableSynthetix'],
                })
              : Promise.resolve(),
            queryClient.invalidateQueries({
              queryKey: [`${network?.id}-${network?.preset}`, 'Allowance'],
            }),
            queryClient.invalidateQueries({
              queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPositions'],
            }),
            !accountId
              ? queryClient.invalidateQueries({
                  queryKey: [`${network?.id}-${network?.preset}`, 'Accounts'],
                })
              : Promise.resolve(),
          ]);

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
          const contractError = errorParserCoreProxy(error);
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
          });
          throw Error('Lock collateral failed', { cause: error });
        }
      },
    },
  });

  const wrapAmountString = wrapETHAmount.toString();
  const isSuccessOrDeposit = state.matches(State.success) || state.matches(State.deposit);
  useEffect(() => {
    if (isSuccessOrDeposit) {
      // We do this to ensure the success state displays the wrap amount used before deposit
      return;
    }
    send(Events.SET_WRAP_AMOUNT, { wrapAmount: wei(wrapAmountString || '0') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessOrDeposit, wrapAmountString]);

  useEffect(() => {
    send(Events.SET_REQUIRE_APPROVAL, { requireApproval });
  }, [requireApproval, send]);

  const hasEnoughStataUSDCBalance = stataUSDCTokenBalance?.gte(synthNeeded);
  useEffect(() => {
    send(Events.SET_HAS_ENOUGH_STATAUSDC, { hasEnoughStataUSDC: hasEnoughStataUSDCBalance });
  }, [hasEnoughStataUSDCBalance, send]);

  useEffect(() => {
    send(Events.SET_REQUIRE_APPROVAL_FOR_STATAUSDC, {
      requireStataUSDCApproval: requireUSDCApproval,
    });
  }, [requireUSDCApproval, send]);

  useEffect(() => {
    send(Events.SET_IS_STATA_USDC, {
      isStataUSDC,
    });
  }, [isStataUSDC, send]);

  const location = useLocation();

  const handleClose = useCallback(() => {
    const isSuccess = state.matches(State.success);

    if (isSuccess && poolId && collateral?.symbol) {
      send(Events.RESET);
      onClose();
      navigate({
        pathname: generatePath('/positions/:collateralType/:poolId', {
          collateralType: collateral.symbol,
          poolId,
        }),
        search: location.search,
      });
    }
    send(Events.RESET);
    onClose();
  }, [location.search, send, onClose, state, poolId, collateral?.symbol, navigate]);

  const onSubmit = useCallback(async () => {
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

  const txSummaryItems = useMemo(() => {
    const items = [
      {
        label: 'Locked ' + collateral?.symbol,
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
    collateral?.symbol,
    isBase,
    liquidityPosition?.collateralPrice,
    txSummary.collateralChange,
    txSummary.currentCollateral,
    txSummary.currentDebt,
  ]);

  return (
    <DepositModalUi
      collateralChange={depositAmount}
      isOpen={isOpen}
      onClose={onClose}
      collateralType={collateral}
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
      networkId={network?.id}
      symbol={synth?.symbol}
    />
  );
};
