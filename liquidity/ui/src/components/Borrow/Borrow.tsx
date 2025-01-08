import { Button, Flex, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useBorrow } from '@snx-v3/useBorrow';
import { useSystemToken } from '@snx-v3/useSystemToken';
import React from 'react';
import { BorrowModal } from './BorrowModal';
import { validatePosition } from '@snx-v3/validatePosition';
import { wei } from '@synthetixio/wei';
import { useNetwork } from '@snx-v3/useBlockchain';

export function Borrow() {
  const [params] = useParams<PositionPageSchemaType>();
  const { debtChange, setDebtChange } = React.useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { data: systemToken } = useSystemToken();
  const { network } = useNetwork();

  const {
    isReady: isBorrowReady,
    txnState,
    mutation: mutationBorrow,
  } = useBorrow({
    borrowAmount: debtChange.gt(0) ? debtChange.abs() : undefined,
  });

  const maxClaimble = React.useMemo(() => {
    if (!liquidityPosition || liquidityPosition?.debt.gte(0)) {
      return ZEROWEI;
    } else {
      return wei(liquidityPosition.debt.abs().toBN());
    }
  }, [liquidityPosition]);

  const { maxDebt } = validatePosition({
    issuanceRatioD18: collateralType?.issuanceRatioD18,
    collateralAmount: liquidityPosition?.collateralAmount,
    collateralPrice: liquidityPosition?.collateralPrice,
    debt: liquidityPosition?.debt,
    collateralChange: ZEROWEI,
    debtChange: debtChange,
  });
  const maxBorrowingCapacity = network?.preset === 'andromeda' ? ZEROWEI : maxDebt.mul(99).div(100);
  const max = React.useMemo(
    () => maxClaimble.add(maxBorrowingCapacity),
    [maxClaimble, maxBorrowingCapacity]
  );

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();
  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        toast.closeAll();
        toast({ title: 'Borrowing...', variant: 'left-accent' });

        await mutationBorrow.mutateAsync();
        setDebtChange(ZEROWEI);

        toast.closeAll();
        toast({
          title: 'Success',
          description: 'Your debt has been increased.',
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
          title: 'Could not complete borrowing',
          description: contractError ? (
            <ContractError contractError={contractError} />
          ) : (
            'Please try again.'
          ),
          status: 'error',
          variant: 'left-accent',
          duration: 3_600_000,
        });
        throw Error('Borrow failed', { cause: error });
      }
    },
    [errorParser, mutationBorrow, setDebtChange, toast]
  );

  return (
    <Flex flexDirection="column" data-cy="borrow form" as="form" onSubmit={onSubmit}>
      <BorrowModal txnStatus={txnState.txnStatus} txnHash={txnState.txnHash} />
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        Borrow
      </Text>
      <BorderBox display="flex" p={3} mb="6">
        <Flex alignItems="flex-start" flexDir="column" gap="1">
          <BorderBox display="flex" py={1.5} px={2.5}>
            <Text display="flex" gap={2} fontSize="16px" alignItems="center" fontWeight="600">
              <TokenIcon symbol={systemToken?.symbol} width={16} height={16} />
              {systemToken?.symbol}
            </Text>
          </BorderBox>
          <Flex fontSize="12px" gap="1">
            <Flex
              gap="1"
              mr="3"
              alignItems="center"
              data-cy="max borrow amount"
              whiteSpace="nowrap"
            >
              {isPendingLiquidityPosition ? '~' : null}
              {!isPendingLiquidityPosition && liquidityPosition ? (
                <>
                  <Amount prefix="Debt: $" value={max} />
                  &nbsp;
                  <Text
                    as="span"
                    cursor="pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setDebtChange(max);
                    }}
                    color="cyan.500"
                    fontWeight={700}
                  >
                    Max
                  </Text>
                </>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
        <Flex flexDirection="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              isRequired: true,
              'data-cy': 'borrow amount input',
              type: 'number',
              min: 0,
            }}
            value={debtChange.abs()}
            onChange={(val) => setDebtChange(val)}
            max={max}
            min={ZEROWEI}
          />
          <Text fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end">
            {isPendingLiquidityPosition ? '~' : null}
            {!isPendingLiquidityPosition &&
            liquidityPosition &&
            liquidityPosition.collateralPrice.gt(0) ? (
              <Amount prefix="$" value={debtChange.abs()} />
            ) : null}
          </Text>
        </Flex>
      </BorderBox>
      <Button
        data-cy="borrow submit"
        type="submit"
        isDisabled={!isBorrowReady || debtChange.gt(max)}
      >
        {debtChange.eq(0) ? 'Enter Amount' : 'Borrow'}
      </Button>
    </Flex>
  );
}
