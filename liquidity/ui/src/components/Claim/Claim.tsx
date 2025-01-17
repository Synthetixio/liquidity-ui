import { Alert, AlertIcon, Box, Button, Collapse, Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import { validatePosition } from '@snx-v3/validatePosition';
import { wei } from '@synthetixio/wei';
import { useContext, useMemo } from 'react';

export function Claim() {
  const { network } = useNetwork();
  const { debtChange, collateralChange, setDebtChange } = useContext(ManagePositionContext);
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const maxClaimble = useMemo(() => {
    if (!liquidityPosition || liquidityPosition?.debt.gte(0)) {
      return ZEROWEI;
    } else {
      return wei(liquidityPosition.debt.abs().toBN().mul(99).div(100));
    }
  }, [liquidityPosition]);

  const { maxDebt } = validatePosition({
    issuanceRatioD18: collateralType?.issuanceRatioD18,
    collateralAmount: liquidityPosition?.collateralAmount,
    collateralPrice: liquidityPosition?.collateralPrice,
    debt: liquidityPosition?.debt,
    collateralChange: collateralChange,
    debtChange: debtChange,
  });

  const maxBorrowingCapacity = network?.preset === 'andromeda' ? ZEROWEI : maxDebt.mul(99).div(100);
  const { data: systemToken } = useSystemToken();
  const max = useMemo(
    () => maxClaimble.add(maxBorrowingCapacity),
    [maxClaimble, maxBorrowingCapacity]
  );

  const symbol = network?.preset === 'andromeda' ? collateralType?.symbol : systemToken?.symbol;
  const price = useTokenPrice(symbol);

  return (
    <Flex flexDirection="column" data-cy="claim form">
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        {network?.preset === 'andromeda' ? 'Claim Profit' : 'Claim/Borrow'}
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
              <TokenIcon symbol={symbol} width={16} height={16} />
              {network?.preset === 'andromeda'
                ? collateralType?.displaySymbol
                : systemToken?.displaySymbol}
            </Text>
          </BorderBox>
          <Flex fontSize="12px" gap="1" data-cy="credit amount">
            {isPendingLiquidityPosition ? 'Credit: ~' : null}
            {!isPendingLiquidityPosition && maxClaimble ? (
              <>
                <Amount prefix="Credit: " value={maxClaimble} />
                &nbsp;
                <Text
                  cursor="pointer"
                  onClick={() => setDebtChange(maxClaimble)}
                  color="cyan.500"
                  fontWeight={700}
                >
                  Max
                </Text>
              </>
            ) : null}
          </Flex>
        </Flex>
        <Flex flexDir="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              isRequired: true,
              'data-cy': 'claim amount input',
              'data-max': maxClaimble.toString(),
              type: 'number',
              min: 0,
            }}
            value={debtChange}
            onChange={(val) => setDebtChange(val)}
            max={max}
            min={ZEROWEI}
          />
          <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
            {price.gt(0) && <Amount prefix="$" value={debtChange.abs().mul(price)} />}
          </Flex>
        </Flex>
      </BorderBox>
      <Collapse in={debtChange.lte(0) && maxClaimble.gt(0)} animateOpacity unmountOnExit>
        <Alert colorScheme="green" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            Positive market performance has credited your position. Claim up to{' '}
            <Box
              onClick={() => {
                if (!maxClaimble) {
                  return;
                }
                setDebtChange(maxClaimble);
              }}
              cursor="pointer"
              as="span"
              textDecoration="underline"
            >
              <Amount value={maxClaimble} prefix="$" />
            </Box>
            &nbsp;without accruing debt.
          </Text>
        </Alert>
      </Collapse>
      <Collapse in={debtChange.gt(0)} animateOpacity unmountOnExit>
        <Alert status="warning" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            Assets will be available to withdraw 24 hours after your last interaction with this
            position.
          </Text>
        </Alert>
      </Collapse>
      <Collapse
        in={debtChange.lte(0) && network?.preset !== 'andromeda' && maxBorrowingCapacity.gt(0)}
        animateOpacity
        unmountOnExit
      >
        <Alert colorScheme="blue" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You can take an interest-free loan up to &nbsp;
            <Box
              onClick={() => {
                if (!maxBorrowingCapacity) {
                  return;
                }
                setDebtChange(maxBorrowingCapacity.add(maxClaimble));
              }}
              cursor="pointer"
              as="span"
              textDecoration="underline"
            >
              <Amount value={maxBorrowingCapacity} prefix="$" />
            </Box>
          </Text>
        </Alert>
      </Collapse>
      <Collapse
        in={
          !debtChange.gt(max) &&
          debtChange.gt(0) &&
          debtChange.gt(maxClaimble) &&
          network?.preset !== 'andromeda'
        }
        animateOpacity
        unmountOnExit
      >
        <Alert colorScheme="info" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You are about to take a <Amount value={debtChange.sub(maxClaimble)} prefix="$" />{' '}
            interest-free loan
          </Text>
        </Alert>
      </Collapse>
      <Button
        isDisabled={debtChange.lte(0) || debtChange.gt(max)}
        data-cy="claim submit"
        type="submit"
      >
        {debtChange.lte(0)
          ? 'Enter Amount'
          : debtChange.gt(maxClaimble) && network?.preset !== 'andromeda'
            ? 'Borrow'
            : 'Claim Profit'}
      </Button>
    </Flex>
  );
}
