import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { parseUnits } from '@snx-v3/format';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useRepay } from '@snx-v3/useRepay';
import { useRepayBaseAndromeda } from '@snx-v3/useRepayBaseAndromeda';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useQueryClient } from '@tanstack/react-query';
import { useMachine } from '@xstate/react';
import React from 'react';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { Events, RepayMachine, ServiceNames, State } from './RepayMachine';

export function RepayModal({ onClose }: { onClose: () => void }) {
  const { debtChange, setDebtChange } = React.useContext(ManagePositionContext);
  const [params] = useParams<PositionPageSchemaType>();

  const { network } = useNetwork();
  const queryClient = useQueryClient();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: systemToken } = useSystemToken();
  const { data: systemTokenBalance } = useTokenBalance(systemToken?.address);

  const availableCollateral =
    systemTokenBalance && liquidityPosition
      ? systemTokenBalance.add(liquidityPosition.availableSystemToken)
      : undefined;

  const { exec: execRepay, settle: settleRepay } = useRepay({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralTypeAddress: collateralType?.tokenAddress,
    debtChange,
    availableUSDCollateral: availableCollateral,
    balance: systemTokenBalance,
  });

  const { exec: execRepayBaseAndromeda, settle: settleRepayBaseAndromeda } = useRepayBaseAndromeda({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralTypeAddress: collateralType?.tokenAddress,
    debtChange,
    availableUSDCollateral: availableCollateral,
  });

  const toast = useToast({ isClosable: true, duration: 9000 });

  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();

  const errorParser = useContractErrorParser();
  const amountToDeposit = debtChange.abs().sub(availableCollateral || 0);

  const { data: synthTokens } = useSynthTokens();
  const wrapperToken = React.useMemo(() => {
    if (synthTokens && collateralType) {
      return synthTokens.find((synth) => synth.address === collateralType.tokenAddress)?.token
        ?.address;
    }
  }, [collateralType, synthTokens]);

  const collateralAddress = network?.preset === 'andromeda' ? wrapperToken : systemToken?.address;

  const { approve, requireApproval } = useApprove({
    contractAddress: collateralAddress,
    amount:
      network?.preset === 'andromeda'
        ? parseUnits(amountToDeposit.toString(), 6) // On Base we use USDC and it has 6 decimals
        : amountToDeposit.toBN(),
    spender: network?.preset === 'andromeda' ? SpotMarketProxy?.address : CoreProxy?.address,
  });

  const [state, send] = useMachine(RepayMachine, {
    services: {
      [ServiceNames.approveSUSD]: async () => {
        try {
          toast({
            title: `Approve ${systemToken?.symbol} for transfer`,
            description: 'The next transaction will repay your debt.',
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

      [ServiceNames.executeRepay]: async () => {
        try {
          toast.closeAll();
          toast({ title: 'Repaying...', variant: 'left-accent' });

          if (network?.preset === 'andromeda') {
            await execRepayBaseAndromeda();
          } else {
            await execRepay();
          }

          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
            }),
            queryClient.invalidateQueries({
              queryKey: [`${network?.id}-${network?.preset}`, 'Allowance'],
            }),
            queryClient.invalidateQueries({
              queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPosition'],
            }),
          ]);

          setDebtChange(ZEROWEI);

          toast.closeAll();
          toast({
            title: 'Success',
            description: 'Your debt has been repaid.',
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
          throw Error('Repay failed', { cause: error });
        }
      },
    },
  });
  const needToDeposit = amountToDeposit.gt(0);

  React.useEffect(() => {
    send(Events.SET_REQUIRE_APPROVAL, { requireApproval: requireApproval && needToDeposit });
  }, [needToDeposit, requireApproval, send]);

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

  const symbol = network?.preset === 'andromeda' ? 'USDC' : systemToken?.symbol;

  if (state.matches(State.success)) {
    return (
      <LiquidityPositionUpdated
        onClose={onSubmit}
        title="Debt successfully Updated"
        subline={
          <>
            Your <b>Debt</b> has been updated, read more about it in the{' '}
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
            <b>Debt</b> successfully Updated
          </>
        }
      />
    );
  }

  return (
    <div data-cy="repay multistep">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon
          cursor="pointer"
          onClick={() => {
            settleRepay();
            settleRepayBaseAndromeda();
            onClose();
          }}
          mr={2}
        />
        Manage Debt
      </Text>
      <Divider my={4} />
      <Multistep
        step={1}
        title={`Approve ${symbol} transfer`}
        status={{
          failed: state.context.error?.step === State.approve,
          success: !state.context.requireApproval || state.matches(State.success),
          loading: state.matches(State.approve) && !state.context.error,
        }}
        checkboxLabel={
          state.context.requireApproval
            ? `Approve unlimited ${symbol} transfers to Synthetix.`
            : undefined
        }
        checkboxProps={{
          isChecked: state.context.infiniteApproval,
          onChange: (e) =>
            send(Events.SET_INFINITE_APPROVAL, { infiniteApproval: e.target.checked }),
        }}
      />
      <Multistep
        step={2}
        title="Repay"
        subtitle={
          <Text>
            Repay <Amount value={debtChange.abs()} suffix={` ${symbol}`} />
          </Text>
        }
        status={{
          failed: state.context.error?.step === State.repay,
          success: state.matches(State.success),
          loading: state.matches(State.repay) && !state.context.error,
        }}
      />

      <Button
        isDisabled={state.matches(State.approve) || state.matches(State.repay)}
        onClick={onSubmit}
        width="100%"
        mt="6"
        data-cy="repay confirm button"
      >
        {(() => {
          switch (true) {
            case Boolean(state.context.error):
              return 'Retry';
            case state.matches(State.approve) || state.matches(State.repay):
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
