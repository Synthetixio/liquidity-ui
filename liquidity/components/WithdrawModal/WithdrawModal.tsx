import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useNetwork, useProvider, useWallet } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useUnwrapStataUSDC } from '@snx-v3/useUnwrapStataUSDC';
import { useWithdraw } from '@snx-v3/useWithdraw';
import { useWithdrawBaseAndromeda } from '@snx-v3/useWithdrawBaseAndromeda';
import { ethers } from 'ethers';
import React, { useContext, useState } from 'react';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';

export function WithdrawModal({
  onClose,
  isDebtWithdrawal = false,
}: {
  onClose: () => void;
  isDebtWithdrawal?: boolean;
}) {
  const [state, setState] = useState({
    step: 1,
    status: 'idle',
  });

  const provider = useProvider();
  const { activeWallet } = useWallet();
  const [params] = useParams<PositionPageSchemaType>();
  const toast = useToast({ isClosable: true, duration: 9000 });
  const { network } = useNetwork();

  const { withdrawAmount, setWithdrawAmount } = useContext(ManagePositionContext);

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const errorParser = useContractErrorParser();

  const isStataUSDC = useIsSynthStataUSDC({ tokenAddress: collateralType?.tokenAddress });

  const { data: systemToken } = useSystemToken();

  const { data: StaticAaveUSDC, isPending: isPendingStaticAaveUSDC } = useStaticAaveUSDC();

  const { mutateAsync: unwrapStata } = useUnwrapStataUSDC();

  const { mutation: withdrawMain, isReady: isReadyWithdrawMain } = useWithdraw({
    amount: withdrawAmount,
    accountId: params.accountId,
    token: isDebtWithdrawal ? systemToken : collateralType,
  });

  const { mutation: withdrawAndromeda, isReady: isReadyWithdrawAndromeda } =
    useWithdrawBaseAndromeda({ amount: withdrawAmount });

  const onSubmit = async () => {
    try {
      if (state.status === 'success') {
        onClose();
      }

      let step = state.step;
      if (step === 1) {
        setState({
          step: 1,
          status: 'pending',
        });

        if (network?.preset === 'andromeda') {
          await withdrawAndromeda.mutateAsync();
        } else {
          await withdrawMain.mutateAsync();
        }

        if (isStataUSDC) {
          step = 2;
          setState({
            step: 2,
            status: 'pending',
          });
        } else {
          setState({
            step: 2,
            status: 'success',
          });
        }
      }
      if (step === 2) {
        if (!(provider && StaticAaveUSDC)) {
          throw new Error('Not ready');
        }

        setState({
          step: 2,
          status: 'pending',
        });

        const StaticAaveUSDCContract = new ethers.Contract(
          StaticAaveUSDC.address,
          StaticAaveUSDC.abi,
          provider
        );

        const balance = await StaticAaveUSDCContract.balanceOf(activeWallet?.address);
        await unwrapStata(balance);

        setState({
          step: 2,
          status: 'success',
        });
      }

      setWithdrawAmount(ZEROWEI);
    } catch (error) {
      setState((state) => ({
        ...state,
        status: 'error',
      }));

      const contractError = errorParser(error);
      if (contractError) {
        console.error(new Error(contractError.name), contractError);
      }
      toast.closeAll();
      toast({
        title: 'Withdraw failed',
        description: contractError ? (
          <ContractError contractError={contractError} />
        ) : (
          'Please try again.'
        ),
        status: 'error',
        variant: 'left-accent',
        duration: 3_600_000,
      });
    }
  };

  if (state.status === 'success') {
    return (
      <LiquidityPositionUpdated
        onClose={onClose}
        title={(isDebtWithdrawal ? 'Debt' : 'Collateral') + ' successfully Withdrawn'}
        subline={
          <>
            Your <b>{isDebtWithdrawal ? 'Debt' : 'Collateral'}</b> has been withdrawn, read more
            about it in the{' '}
            <Link
              href="https://docs.synthetix.io/v/synthetix-v3-user-documentation"
              target="_blank"
              color="cyan.500"
            >
              Synthetix V3 Documentation
            </Link>
          </>
        }
        alertText={(isDebtWithdrawal ? 'Debt' : 'Collateral') + ' successfully Withdrawn'}
      />
    );
  }

  return (
    <div data-cy="withdraw multistep">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon cursor="pointer" onClick={onClose} mr={2} />
        Manage {isDebtWithdrawal ? 'Debt' : 'Collateral'}
      </Text>
      <Divider my={4} />
      <Multistep
        step={1}
        title="Withdraw"
        subtitle={
          <Amount
            value={withdrawAmount}
            suffix={` ${
              isDebtWithdrawal ? systemToken?.displaySymbol : collateralType?.displaySymbol
            } will be withdrawn`}
          />
        }
        status={{
          failed: state.step === 1 && state.status === 'error',
          success: state.step > 1,
          loading: state.step === 1 && state.status === 'pending',
        }}
      />
      {isStataUSDC && (
        <Multistep
          step={2}
          title="Unwrap"
          subtitle={<Text as="div">unwrap Static aUSDC into USDC</Text>}
          status={{
            failed: state.step === 2 && state.status === 'error',
            success: state.status === 'success',
            loading: state.step === 2 && state.status === 'pending',
          }}
        />
      )}
      <Button
        isDisabled={
          (network?.preset === 'andromeda' && !isReadyWithdrawAndromeda) ||
          (network?.preset !== 'andromeda' && !isReadyWithdrawMain) ||
          state.status === 'pending' ||
          isPendingStaticAaveUSDC
        }
        onClick={onSubmit}
        width="100%"
        mt="6"
        data-cy="withdraw confirm button"
      >
        {(() => {
          switch (true) {
            case state.status === 'error':
              return 'Retry';
            case state.status === 'pending':
              return 'Processing...';
            case state.status === 'success':
              return 'Done';
            default:
              return 'Execute Transaction';
          }
        })()}
      </Button>
    </div>
  );
}
