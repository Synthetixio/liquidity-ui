import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useBorrow } from '@snx-v3/useBorrow';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { wei } from '@synthetixio/wei';
import { useCallback, useContext, useMemo, useState } from 'react';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';
import { ClaimSuccessBanner } from './ClaimSuccessBanner';

export function ClaimModal({ onClose }: { onClose: () => void }) {
  const [params] = useParams<PositionPageSchemaType>();
  const { debtChange, setDebtChange } = useContext(ManagePositionContext);
  const { network } = useNetwork();
  const [showClaimBanner, setShowClaimBanner] = useState(false);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: systemToken } = useSystemToken();

  const maxClaimble = useMemo(() => {
    if (!liquidityPosition || liquidityPosition?.debt.gte(0)) {
      return ZEROWEI;
    } else {
      return wei(liquidityPosition.debt.abs().toBN().sub(1));
    }
  }, [liquidityPosition]);
  const isBorrow = useMemo(
    () => debtChange.gt(maxClaimble) && network?.preset !== 'andromeda',
    [debtChange, network?.preset, maxClaimble]
  );

  const {
    exec: execBorrow,
    txnState,
    settle: settleBorrow,
  } = useBorrow({
    borrowAmount: debtChange.gt(0) ? debtChange.abs() : undefined,
  });

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();
  const execBorrowWithErrorParser = useCallback(async () => {
    try {
      await execBorrow();
      setDebtChange(ZEROWEI);
    } catch (error: any) {
      const contractError = errorParser(error);
      if (contractError) {
        console.error(new Error(contractError.name), contractError);
      }
      toast.closeAll();
      toast({
        title: isBorrow ? 'Borrow' : 'Claim' + ' failed',
        description: contractError ? (
          <ContractError contractError={contractError} />
        ) : (
          'Please try again.'
        ),
        status: 'error',
        variant: 'left-accent',
        duration: 3_600_000,
      });
      throw Error(isBorrow ? 'Borrow' : 'Claim' + ' failed', { cause: error });
    }
  }, [execBorrow, setDebtChange, errorParser, toast, isBorrow]);

  const symbol =
    network?.preset === 'andromeda' ? collateralType?.displaySymbol : systemToken?.symbol;

  if (txnState.txnStatus === 'success') {
    if (showClaimBanner) {
      return (
        <ClaimSuccessBanner
          onClose={() => {
            settleBorrow();
            onClose();
          }}
        />
      );
    } else {
      return (
        <LiquidityPositionUpdated
          onClose={() => {
            if (network?.id === 1 && network?.preset === 'main') {
              setShowClaimBanner(true);
            } else {
              settleBorrow();
              onClose();
            }
          }}
          title="Debt successfully updated"
          subline={
            <>
              Your <b>Debt</b> has been updated. To learn more, visit the{' '}
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
              <b>Debt</b> successfully updated
            </>
          }
        />
      );
    }
  }

  return (
    <div data-cy="claim multistep">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon
          cursor="pointer"
          onClick={() => {
            settleBorrow();
            onClose();
          }}
          mr={2}
        />
        Manage Debt
      </Text>

      <Divider my={4} />

      <Multistep
        step={1}
        title={network?.preset === 'andromeda' ? 'Claim' : 'Borrow'}
        subtitle={
          <Text as="div">
            {network?.preset === 'andromeda' ? 'Claim' : 'Borrow'}
            <Amount prefix=" " value={debtChange} suffix={` ${symbol}`} />
          </Text>
        }
        status={{
          failed: txnState.txnStatus === 'error',
          loading: ['prompting', 'pending'].includes(txnState.txnStatus),
        }}
      />

      <Button
        isDisabled={['pending', 'prompting'].includes(txnState.txnStatus)}
        onClick={() => {
          if (['unsent', 'error'].includes(txnState.txnStatus)) {
            execBorrowWithErrorParser();
          }
        }}
        width="100%"
        mt="6"
        data-cy="claim confirm button"
      >
        {(() => {
          switch (txnState.txnStatus) {
            case 'error':
              return 'Retry';
            case 'pending':
            case 'prompting':
              return 'Processing...';
            default:
              return 'Execute Transaction';
          }
        })()}
      </Button>
    </div>
  );
}
