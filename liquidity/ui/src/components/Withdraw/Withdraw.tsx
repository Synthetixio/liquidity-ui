import { Alert, AlertIcon, Button, Collapse, Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { useAccountCollateralUnlockDate } from '@snx-v3/useAccountCollateralUnlockDate';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useWithdrawTimer } from '@snx-v3/useWithdrawTimer';
import React from 'react';

export function Withdraw({ isDebtWithdrawal = false }: { isDebtWithdrawal?: boolean }) {
  const [params] = useParams<PositionPageSchemaType>();
  const { setWithdrawAmount, withdrawAmount } = React.useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { network } = useNetwork();

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: systemToken } = useSystemToken();

  const { data: accountCollateralUnlockDate, isLoading: isLoadingDate } =
    useAccountCollateralUnlockDate({ accountId: params.accountId });

  const symbol =
    network?.preset === 'andromeda'
      ? 'USDC'
      : isDebtWithdrawal
        ? systemToken?.symbol
        : collateralType?.symbol;
  const { minutes, hours, isRunning } = useWithdrawTimer(params.accountId);
  const unlockDate = !isLoadingDate ? accountCollateralUnlockDate : null;

  const maxWithdrawable =
    network?.preset === 'andromeda' && liquidityPosition
      ? liquidityPosition.availableCollateral.add(liquidityPosition.availableSystemToken)
      : isDebtWithdrawal
        ? liquidityPosition?.availableSystemToken
        : liquidityPosition?.availableCollateral;

  return (
    <Flex flexDirection="column" data-cy="withdraw form">
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        {isDebtWithdrawal ? 'Withdraw' : 'Withdraw Collateral'}
      </Text>
      <BorderBox display="flex" p={3} mb="6">
        <Flex alignItems="flex-start" flexDir="column" gap="1">
          <BorderBox display="flex" py={1.5} px={2.5}>
            <Text display="flex" gap={2} fontSize="16px" alignItems="center" fontWeight="600">
              <TokenIcon symbol={symbol} width={16} height={16} />
              {isDebtWithdrawal ? systemToken?.symbol : collateralType?.displaySymbol}
            </Text>
          </BorderBox>
          <Text fontSize="12px" whiteSpace="nowrap" data-cy="withdraw amount">
            {isDebtWithdrawal && isPendingLiquidityPosition ? 'Available: ~' : null}
            {!isDebtWithdrawal && isPendingLiquidityPosition ? 'Unlocked: ~' : null}
            {maxWithdrawable ? (
              <>
                <Amount
                  prefix={isDebtWithdrawal ? 'Available: ' : 'Unlocked: '}
                  value={maxWithdrawable}
                />
                &nbsp;
                {maxWithdrawable.gt(0) && (
                  <Text
                    as="span"
                    cursor="pointer"
                    onClick={() => setWithdrawAmount(maxWithdrawable)}
                    color="cyan.500"
                    fontWeight={700}
                  >
                    Max
                  </Text>
                )}
              </>
            ) : null}
          </Text>
        </Flex>
        <Flex flexDir="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              isRequired: true,
              'data-cy': 'withdraw amount input',
              type: 'number',
              min: 0,
            }}
            value={withdrawAmount}
            onChange={(val) => setWithdrawAmount(val)}
            max={maxWithdrawable}
            min={ZEROWEI}
          />
          <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
            {isPendingLiquidityPosition ? '~' : null}
            {!isPendingLiquidityPosition &&
            liquidityPosition &&
            liquidityPosition.collateralPrice.gt(0) ? (
              <Amount
                prefix="$"
                value={withdrawAmount.abs().mul(liquidityPosition.collateralPrice)}
              />
            ) : null}
          </Flex>
        </Flex>
      </BorderBox>

      <Collapse in={maxWithdrawable && maxWithdrawable.gt(0) && isRunning} animateOpacity>
        <Alert status="warning" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You will be able to withdraw assets in {hours}H{minutes}M. Any account activity will
            reset this timer to 24H.
          </Text>
        </Alert>
      </Collapse>

      <Collapse in={maxWithdrawable && maxWithdrawable.gt(0) && !isRunning} animateOpacity>
        <Alert status="success" mb="6" borderRadius="6px">
          <AlertIcon />
          <Amount prefix="You can now withdraw " value={maxWithdrawable} suffix={` ${symbol}`} />
        </Alert>
      </Collapse>

      <Collapse in={maxWithdrawable && withdrawAmount.gt(maxWithdrawable)} animateOpacity>
        <Alert colorScheme="red" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You cannot Withdraw more {!isDebtWithdrawal ? 'Collateral' : ''} than your Unlocked
            Balance
          </Text>
        </Alert>
      </Collapse>

      <Button
        isDisabled={
          withdrawAmount.lte(0) ||
          isRunning ||
          !unlockDate ||
          (maxWithdrawable && withdrawAmount.gt(maxWithdrawable))
        }
        data-cy="withdraw submit"
        type="submit"
      >
        {withdrawAmount.gt(0) ? 'Withdraw' : 'Enter Amount'}
      </Button>
    </Flex>
  );
}
