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
import { useRepay } from '@snx-v3/useRepay';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { RepayModal } from './RepayModal';

export function Repay() {
  const [params] = useParams<PositionPageSchemaType>();
  const { debtChange, setDebtChange } = React.useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { data: systemToken } = useSystemToken();
  const { data: systemTokenBalance, isPending: isPendingSystemTokenBalance } = useTokenBalance(
    systemToken?.address
  );

  const availableSystemToken =
    systemTokenBalance && liquidityPosition
      ? systemTokenBalance.add(liquidityPosition.availableSystemToken)
      : undefined;

  const {
    isReady: isReadyRepay,
    txnState,
    mutation: mutationRepay,
  } = useRepay({
    repayAmount: debtChange && debtChange.lt(0) ? debtChange.abs() : undefined,
  });

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();
  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        toast.closeAll();
        toast({ title: 'Repaying...', variant: 'left-accent' });

        await mutationRepay.mutateAsync();
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
    [errorParser, mutationRepay, setDebtChange, toast]
  );

  return (
    <Flex flexDirection="column" data-cy="repay debt form" as="form" onSubmit={onSubmit}>
      <RepayModal txnStatus={txnState.txnStatus} txnHash={txnState.txnHash} />
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        Repay Debt
      </Text>
      <BorderBox display="flex" p={3} mb="6">
        <Flex alignItems="flex-start" flexDir="column" gap="1">
          <BorderBox display="flex" py={1.5} px={2.5}>
            <Text
              display="flex"
              gap={2}
              fontSize="16px"
              alignItems="center"
              fontWeight="600"
              whiteSpace="nowrap"
            >
              <TokenIcon symbol={systemToken?.symbol} width={16} height={16} />
              {systemToken?.displaySymbol}
            </Text>
          </BorderBox>
          <Flex fontSize="12px" gap="1">
            <Flex
              gap="1"
              mr="3"
              alignItems="center"
              data-cy="current debt amount"
              whiteSpace="nowrap"
            >
              {isPendingLiquidityPosition || isPendingSystemTokenBalance ? '~' : null}
              {!(isPendingLiquidityPosition || isPendingSystemTokenBalance) &&
              liquidityPosition &&
              availableSystemToken ? (
                <>
                  {liquidityPosition.debt.abs().gt(availableSystemToken) ? (
                    <>
                      <Amount prefix="Available: $" value={availableSystemToken} />
                      &nbsp;
                      <Text
                        as="span"
                        cursor="pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setDebtChange(availableSystemToken.mul(-1));
                        }}
                        color="cyan.500"
                        fontWeight={700}
                      >
                        Max
                      </Text>
                    </>
                  ) : null}
                  {availableSystemToken.gt(liquidityPosition.debt.abs()) ? (
                    <>
                      <Amount prefix="Debt: $" value={liquidityPosition.debt.abs()} />
                      &nbsp;
                      <Text
                        as="span"
                        cursor="pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setDebtChange(liquidityPosition.debt.neg());
                        }}
                        color="cyan.500"
                        fontWeight={700}
                      >
                        Max
                      </Text>
                    </>
                  ) : null}
                </>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
        <Flex flexDirection="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              isRequired: true,
              'data-cy': 'repay amount input',
              type: 'number',
              min: 0,
            }}
            value={debtChange.abs()}
            onChange={(val) => setDebtChange(val.mul(-1))}
            max={liquidityPosition ? liquidityPosition.debt : wei(0)}
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
      <Button data-cy="repay submit" type="submit" isDisabled={!isReadyRepay}>
        {debtChange.eq(0) ? 'Enter Amount' : 'Repay'}
      </Button>
    </Flex>
  );
}
