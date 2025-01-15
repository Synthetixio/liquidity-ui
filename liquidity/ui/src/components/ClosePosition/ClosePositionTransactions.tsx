import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Flex, Link, Skeleton, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { parseUnits } from '@snx-v3/format';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useBorrow } from '@snx-v3/useBorrow';
import { useClosePosition } from '@snx-v3/useClosePosition';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useDebtRepayer } from '@snx-v3/useDebtRepayer';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useRepay } from '@snx-v3/useRepay';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useUndelegate } from '@snx-v3/useUndelegate';
import { useUndelegateBaseAndromeda } from '@snx-v3/useUndelegateBaseAndromeda';
import { useUSDC } from '@snx-v3/useUSDC';
import { ethers } from 'ethers';
import React from 'react';
import { LiquidityPositionUpdated } from '../Manage/LiquidityPositionUpdated';

export function ClosePositionTransactions({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const [steps, setSteps] = React.useState<
    {
      title: React.ReactNode;
      subtitle?: React.ReactNode;
      cb: () => Promise<any>;
    }[]
  >([]);
  const { setCollateralChange, setDebtChange } = React.useContext(ManagePositionContext);
  const { data: systemToken } = useSystemToken();
  const { data: CoreProxy } = useCoreProxy();
  const { network } = useNetwork();
  const toast = useToast({ isClosable: true, duration: 9000 });

  const debtSymbol = network?.preset === 'andromeda' ? collateralType?.symbol : systemToken?.symbol;
  const collateralSymbol = collateralType?.displaySymbol;

  const [txState, setTxState] = React.useState({
    step: 0,
    status: 'idle',
  });

  const { data: synthTokens } = useSynthTokens();
  const wrapperToken = React.useMemo(() => {
    if (synthTokens && collateralType) {
      return synthTokens.find((synth) => synth.address === collateralType.tokenAddress)?.token
        ?.address;
    }
  }, [collateralType, synthTokens]);

  const collateralAddress = network?.preset === 'andromeda' ? wrapperToken : systemToken?.address;
  const availableUSDCollateral = liquidityPosition?.availableCollateral || ZEROWEI;
  const errorParser = useContractErrorParser();

  //repay approval
  const { approve, requireApproval } = useApprove({
    contractAddress: collateralAddress,
    amount:
      liquidityPosition && liquidityPosition.debt.abs().sub(availableUSDCollateral).gt(0)
        ? liquidityPosition.debt.abs().sub(availableUSDCollateral).toBN()
        : undefined,
    spender: CoreProxy?.address,
  });
  const { exec: execRepay } = useRepay({ repayAmount: liquidityPosition?.debt });
  const { exec: undelegate } = useUndelegate({
    undelegateAmount: liquidityPosition?.collateralAmount.gt(0)
      ? liquidityPosition?.collateralAmount
      : undefined,
  });

  const { data: DebtRepayer } = useDebtRepayer();
  const { data: ClosePositionContract } = useClosePosition();
  const { data: USDC } = useUSDC();

  // repay approval for base
  const {
    approve: approveUSDC,
    requireApproval: requireApprovalUSDC,
    isLoading,
  } = useApprove({
    contractAddress: USDC?.address,
    // slippage for approval
    amount: liquidityPosition
      ? parseUnits(liquidityPosition.debt.abs().toString(), 6).mul(120).div(100)
      : ethers.BigNumber.from(0),
    spender: DebtRepayer?.address,
  });

  const { exec: undelegateBaseAndromeda } = useUndelegateBaseAndromeda({
    undelegateAmount: liquidityPosition?.collateralAmount,
  });

  //claim
  const { exec: execBorrow } = useBorrow({
    borrowAmount: liquidityPosition?.debt.lt(0) ? liquidityPosition?.debt.abs() : undefined,
  });

  const getSteps = React.useCallback(() => {
    const transactions: {
      title: React.ReactNode;
      subtitle?: React.ReactNode;
      cb: () => Promise<any>;
    }[] = [];

    if (ClosePositionContract) {
      // TODO: one step close
      // console.log(`ClosePositionContract`, ClosePositionContract);
    }

    if (network?.preset !== 'andromeda') {
      if (liquidityPosition?.debt.gt(0)) {
        if (requireApproval) {
          transactions.push({
            title: `Approve ${systemToken?.symbol} transfer`,
            cb: () => approve(false),
          });
        }
        transactions.push({
          title: 'Repay',
          subtitle: (
            <Amount
              prefix="Repay "
              value={liquidityPosition?.debt.abs()}
              suffix={` ${systemToken?.symbol}`}
            />
          ),
          cb: () => execRepay(),
        });
      } else if (liquidityPosition?.debt.lt(0)) {
        transactions.push({
          title: 'Claim',
          subtitle: (
            <Amount
              prefix="Claim "
              value={liquidityPosition?.debt.abs()}
              suffix={` ${systemToken?.symbol}`}
            />
          ),
          cb: () => execBorrow(),
        });
      }

      transactions.push({
        title: 'Unlock collateral',
        subtitle: (
          <Amount
            value={liquidityPosition?.collateralAmount || ZEROWEI}
            suffix={` ${collateralSymbol} will be unlocked from the pool.`}
          />
        ),
        cb: () => undelegate(),
      });
    } else {
      if (liquidityPosition?.debt.gt(-0.00001) && requireApprovalUSDC) {
        transactions.push({
          title: `Approve ${debtSymbol} transfer`,
          cb: () => approveUSDC(false),
        });
      }

      transactions.push({
        title: 'Unlock collateral',
        subtitle: (
          <Amount
            value={liquidityPosition?.collateralAmount || ZEROWEI}
            suffix={` ${collateralSymbol} will be unlocked from the pool.`}
          />
        ),
        cb: () => undelegateBaseAndromeda(),
      });
    }

    return transactions;
  }, [
    ClosePositionContract,
    approve,
    approveUSDC,
    collateralSymbol,
    debtSymbol,
    execBorrow,
    execRepay,
    network?.preset,
    liquidityPosition?.collateralAmount,
    liquidityPosition?.debt,
    requireApproval,
    requireApprovalUSDC,
    systemToken?.symbol,
    undelegate,
    undelegateBaseAndromeda,
  ]);

  React.useEffect(() => {
    if (!steps.length && !isLoading) {
      setTxState({
        step: 0,
        status: 'idle',
      });
      setSteps(getSteps());
    }
  }, [getSteps, isLoading, steps.length]);

  const isSuccess = txState.step >= steps.length;

  const handleSubmit = React.useCallback(async () => {
    try {
      let i = txState.step > -1 ? txState.step : 0;

      for (; i < steps.length; i++) {
        setTxState({
          step: i,
          status: 'pending',
        });

        await steps[i].cb();
      }

      setTxState({
        step: steps.length,
        status: 'success',
      });

      setCollateralChange(ZEROWEI);
      setDebtChange(ZEROWEI);
    } catch (error) {
      setTxState((state) => ({
        step: state.step,
        status: 'error',
      }));

      const contractError = errorParser(error);

      if (contractError) {
        console.error(new Error(contractError.name), contractError);
      }
      toast.closeAll();
      toast({
        title: 'Transaction failed',
        variant: 'left-accent',
        description: contractError ? (
          <ContractError contractError={contractError} />
        ) : (
          'Please try again.'
        ),
        status: 'error',
        duration: 3_600_000,
      });
      throw Error('Transaction failed', { cause: error });
    }
  }, [txState.step, steps, setCollateralChange, setDebtChange, errorParser, toast]);

  if (isSuccess) {
    return (
      <LiquidityPositionUpdated
        onClose={onClose}
        title="Position successfully closed"
        subline={
          <>
            Your position has been successfully closed. To learn more, visit the{' '}
            <Link
              href="https://docs.synthetix.io/v/synthetix-v3-user-documentation"
              target="_blank"
              color="cyan.500"
            >
              Synthetix V3 Documentation
            </Link>
          </>
        }
        alertText={<>Position successfully closed</>}
      />
    );
  }

  return (
    <Flex flexDirection="column" data-cy="close position multistep">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon cursor="pointer" onClick={onBack} mr={2} />
        Close Position
      </Text>

      <Divider mt={6} bg="gray.900" />

      {isLoading && !steps.length && <Skeleton width="100%" height="78px" mt="6" />}
      {steps.map((step, i) => (
        <Multistep
          key={i}
          step={i + 1}
          title={step.title}
          subtitle={step.subtitle}
          status={{
            failed: txState.step === i && txState.status === 'error',
            success: txState.step > i,
            loading: txState.step === i && txState.status === 'pending',
          }}
        />
      ))}

      <Button
        data-cy="close position confirm button"
        isLoading={txState.status === 'pending'}
        onClick={handleSubmit}
        mt="6"
      >
        {(() => {
          switch (true) {
            case txState.status === 'error':
              return 'Retry';
            case txState.status === 'pending':
              return 'Processing...';
            default:
              return 'Execute Transaction';
          }
        })()}
      </Button>
    </Flex>
  );
}
