import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { getWrappedStataUSDCOnBase, isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useAccountCollateral } from '@snx-v3/useAccountCollateral';
import { useDefaultProvider, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useUnwrapStataUSDC } from '@snx-v3/useUnwrapStataUSDC';
import { useWithdraw } from '@snx-v3/useWithdraw';
import { useWithdrawBaseAndromeda } from '@snx-v3/useWithdrawBaseAndromeda';
import { Wei } from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import React, { FC, useContext, useState } from 'react';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';

export const WithdrawModalUi: FC<{
  amount: Wei;
  isOpen: boolean;
  onClose: () => void;
  symbol?: string;
  state: {
    step: number;
    status: string;
  };
  onSubmit: () => void;
  isDebtWithdrawal: boolean;
  isStataUSDC: boolean;
}> = ({ isStataUSDC, isDebtWithdrawal, amount, isOpen, onClose, onSubmit, state, symbol }) => {
  if (isOpen) {
    if (state.status === 'success') {
      return (
        <LiquidityPositionUpdated
          onClose={onSubmit}
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
            <Text as="div">
              <Amount value={amount} />
              &nbsp;{symbol} will be withdrawn
            </Text>
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
          isDisabled={state.status === 'pending'}
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
};

export function WithdrawModal({
  liquidityPosition,
  onClose,
  isOpen,
  isDebtWithdrawal = false,
}: {
  liquidityPosition?: LiquidityPosition;
  isOpen: boolean;
  onClose: () => void;
  isDebtWithdrawal?: boolean;
}) {
  const [txState, setTxState] = useState({
    step: 1,
    status: 'idle',
  });

  const provider = useDefaultProvider();
  const { activeWallet } = useWallet();
  const params = useParams();
  const toast = useToast({ isClosable: true, duration: 9000 });
  const { network } = useNetwork();
  const queryClient = useQueryClient();

  const { withdrawAmount, setWithdrawAmount } = useContext(ManagePositionContext);

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const errorParser = useContractErrorParser();
  const accountId = liquidityPosition?.accountId;

  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const isStataUSDC =
    collateralType?.address.toLowerCase() === getWrappedStataUSDCOnBase(network?.id).toLowerCase();

  const { data: systemToken } = useSystemToken();
  const { data: systemTokenBalance } = useAccountCollateral(accountId, systemToken?.address);

  const { data: StaticAaveUSDC } = useStaticAaveUSDC();

  const { mutateAsync: unwrapStata } = useUnwrapStataUSDC();

  const { mutation: withdrawMain } = useWithdraw({
    amount: withdrawAmount,
    accountId,
    collateralTypeAddress: isDebtWithdrawal
      ? systemToken?.address
      : liquidityPosition?.accountCollateral?.tokenAddress,
  });

  const { mutation: withdrawAndromeda } = useWithdrawBaseAndromeda({
    accountId,
    availableCollateral: liquidityPosition?.accountCollateral.availableCollateral || ZEROWEI,
    snxUSDCollateral: systemTokenBalance?.availableCollateral || ZEROWEI,
    amountToWithdraw: withdrawAmount,
    accountCollateral: liquidityPosition?.accountCollateral,
    collateralSymbol: params.collateralSymbol,
  });

  const onSubmit = async () => {
    try {
      if (!(provider && StaticAaveUSDC)) {
        throw new Error('Not ready');
      }

      if (txState.status === 'success') {
        onClose();
      }
      let step = txState.step;
      if (step === 1) {
        setTxState({
          step: 1,
          status: 'pending',
        });

        if (!isBase) {
          await withdrawMain.mutateAsync();
        } else {
          await withdrawAndromeda.mutateAsync();

          step = 2;
          if (isStataUSDC) {
            setTxState({
              step: 2,
              status: 'pending',
            });
          } else {
            setTxState({
              step: 2,
              status: 'success',
            });
          }
        }
      }
      if (step === 2) {
        setTxState({
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

        setTxState({
          step: 2,
          status: 'success',
        });
      }

      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPosition', { accountId }],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'AccountSpecificCollateral', { accountId }],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPositions', { accountId }],
      });
      queryClient.invalidateQueries({
        queryKey: [
          `${network?.id}-${network?.preset}`,
          'AccountCollateralUnlockDate',
          { accountId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
      });

      setWithdrawAmount(ZEROWEI);
    } catch (error) {
      setTxState((state) => ({
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
      throw Error('Withdraw failed', { cause: error });
    }
  };

  return (
    <WithdrawModalUi
      amount={withdrawAmount}
      isOpen={isOpen}
      onClose={onClose}
      symbol={isDebtWithdrawal ? systemToken?.symbol : collateralType?.displaySymbol}
      state={txState}
      onSubmit={onSubmit}
      isDebtWithdrawal={isDebtWithdrawal}
      isStataUSDC={isStataUSDC}
    />
  );
}
