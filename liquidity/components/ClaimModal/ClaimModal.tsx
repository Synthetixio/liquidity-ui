import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Flex, Link, Skeleton, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { TransactionStatus } from '@snx-v3/txnReducer';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useBorrow } from '@snx-v3/useBorrow';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import Wei, { wei } from '@synthetixio/wei';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useContext, useMemo } from 'react';
import { LiquidityPositionUpdated } from '../../ui/src/components/Manage/LiquidityPositionUpdated';

export const ClaimModalUi: React.FC<{
  onClose: () => void;
  debtChange: Wei;
  isOpen: boolean;
  txnStatus: TransactionStatus;
  execBorrow: () => void;
  symbol: string;
}> = ({ symbol, onClose, isOpen, debtChange, txnStatus, execBorrow }) => {
  const { network } = useNetwork();
  const isBase = isBaseAndromeda(network?.id, network?.preset);

  if (isOpen) {
    if (txnStatus === 'success') {
      return (
        <LiquidityPositionUpdated
          onClose={onClose}
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
      <div data-cy="claim multistep">
        <Text color="gray.50" fontSize="20px" fontWeight={700}>
          <ArrowBackIcon cursor="pointer" onClick={onClose} mr={2} />
          Manage Debt
        </Text>

        <Divider my={4} />

        <Multistep
          step={1}
          title={isBase ? 'Claim' : 'Borrow'}
          subtitle={
            <Text as="div">
              {isBase ? 'Claim' : 'Borrow'}
              <Amount prefix=" " value={debtChange} suffix={` ${symbol}`} />
            </Text>
          }
          status={{
            failed: txnStatus === 'error',
            loading: ['prompting', 'pending'].includes(txnStatus),
          }}
        />

        <Button
          isDisabled={['pending', 'prompting'].includes(txnStatus)}
          onClick={() => {
            if (['unsent', 'error'].includes(txnStatus)) {
              execBorrow();
            }
          }}
          width="100%"
          mt="6"
          data-cy="claim confirm button"
        >
          {(() => {
            switch (txnStatus) {
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
};

export const ClaimModal: React.FC<{
  onClose: () => void;
  isOpen: boolean;
  liquidityPosition?: LiquidityPosition;
}> = ({ onClose, isOpen, liquidityPosition }) => {
  const { debtChange, setDebtChange } = useContext(ManagePositionContext);
  const queryClient = useQueryClient();
  const params = useParams();
  const { network } = useNetwork();
  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: systemToken } = useSystemToken();

  const maxClaimble = useMemo(() => {
    if (!liquidityPosition || liquidityPosition?.debt.gte(0)) {
      return ZEROWEI;
    } else {
      return wei(liquidityPosition.debt.abs().toBN().sub(1));
    }
  }, [liquidityPosition]);
  const isBorrow = useMemo(
    () => debtChange.gt(maxClaimble) && !isBase,
    [debtChange, isBase, maxClaimble]
  );

  const {
    exec: execBorrow,
    txnState,
    settle: settleBorrow,
  } = useBorrow({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralTypeAddress: collateralType?.tokenAddress,
    debtChange,
  });

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();
  const execBorrowWithErrorParser = useCallback(async () => {
    try {
      await execBorrow();

      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPosition'],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'AccountCollateralUnlockDate'],
      });

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
      });
      throw Error(isBorrow ? 'Borrow' : 'Claim' + ' failed', { cause: error });
    }
  }, [
    execBorrow,
    queryClient,
    network?.id,
    network?.preset,
    setDebtChange,
    errorParser,
    toast,
    isBorrow,
  ]);

  const { txnStatus } = txnState;

  if (!(params.poolId && params.accountId && collateralType && systemToken))
    return (
      <Flex gap={4} flexDirection="column">
        <Skeleton maxW="232px" width="100%" height="20px" />
        <Divider my={4} />
        <Skeleton width="100%" height="20px" />
        <Skeleton width="100%" height="20px" />
      </Flex>
    );

  return (
    <ClaimModalUi
      execBorrow={execBorrowWithErrorParser}
      debtChange={debtChange}
      txnStatus={txnStatus}
      onClose={() => {
        settleBorrow();
        onClose();
      }}
      isOpen={isOpen}
      symbol={isBase ? collateralType.symbol : systemToken.symbol}
    />
  );
};
