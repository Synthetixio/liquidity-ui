import { Alert, AlertIcon, Button, Collapse, Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { useAccountCollateral } from '@snx-v3/useAccountCollateral';
import { useAccountCollateralUnlockDate } from '@snx-v3/useAccountCollateralUnlockDate';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import { useWithdrawTimer } from '@snx-v3/useWithdrawTimer';
import { useContext, useMemo } from 'react';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export function Withdraw({ isDebtWithdrawal = false }: { isDebtWithdrawal?: boolean }) {
  const { setWithdrawAmount, withdrawAmount } = useContext(ManagePositionContext);
  const params = useParams();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { network } = useNetwork();
  const isBase = isBaseAndromeda(network?.id, network?.preset);

  const { data: liquidityPosition } = useLiquidityPosition({
    tokenAddress: collateralType?.tokenAddress,
    accountId: params.accountId,
    poolId: params.poolId,
  });

  const { data: systemToken } = useSystemToken();
  const { data: systemTokenBalance } = useAccountCollateral(params.accountId, systemToken?.address);

  const maxWithdrawable = useMemo(() => {
    if (isBase) {
      return (liquidityPosition?.accountCollateral.availableCollateral || ZEROWEI).add(
        systemTokenBalance?.availableCollateral || ZEROWEI
      );
    }
    if (isDebtWithdrawal) {
      return systemTokenBalance?.availableCollateral || ZEROWEI;
    }
    return liquidityPosition?.accountCollateral.availableCollateral || ZEROWEI;
  }, [
    isBase,
    isDebtWithdrawal,
    liquidityPosition?.accountCollateral.availableCollateral,
    systemTokenBalance?.availableCollateral,
  ]);

  const { data: accountCollateralUnlockDate, isLoading: isLoadingDate } =
    useAccountCollateralUnlockDate({ accountId: params.accountId });

  const symbol = isDebtWithdrawal ? systemToken?.symbol : collateralType?.symbol;
  const price = useTokenPrice(symbol);
  const { minutes, hours, isRunning } = useWithdrawTimer(params.accountId);
  const unlockDate = !isLoadingDate ? accountCollateralUnlockDate : null;

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
          <Flex fontSize="12px" gap="1" data-cy="withdraw amount">
            <Amount
              prefix={isDebtWithdrawal ? 'Max Withdraw: ' : 'Unlocked: '}
              value={maxWithdrawable}
            />
            {maxWithdrawable.gt(0) && (
              <Text
                cursor="pointer"
                onClick={() => {
                  if (!maxWithdrawable) {
                    return;
                  }
                  setWithdrawAmount(maxWithdrawable);
                }}
                color="cyan.500"
                fontWeight={700}
              >
                &nbsp;Max
              </Text>
            )}
          </Flex>
        </Flex>
        <Flex flexDir="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              isRequired: true,
              'data-cy': 'withdraw amount input',
              'data-max': maxWithdrawable.toString(),
              type: 'number',
              min: 0,
            }}
            value={withdrawAmount}
            onChange={(val) => setWithdrawAmount(val)}
            max={maxWithdrawable}
            min={ZEROWEI}
          />
          <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
            {price.gt(0) && <Amount prefix="$" value={withdrawAmount.abs().mul(price)} />}
          </Flex>
        </Flex>
      </BorderBox>

      <Collapse in={maxWithdrawable.gt(0) && isRunning} animateOpacity>
        <Alert status="warning" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You will be able to withdraw assets in {hours}H{minutes}M. Any account activity will
            reset this timer to 24H.
          </Text>
        </Alert>
      </Collapse>

      <Collapse in={maxWithdrawable.gt(0) && !isRunning} animateOpacity>
        <Alert status="success" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You can now withdraw <Amount value={maxWithdrawable} suffix={` ${symbol}`} />
          </Text>
        </Alert>
      </Collapse>

      <Collapse in={withdrawAmount.gt(maxWithdrawable)} animateOpacity>
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
          withdrawAmount.lte(0) || isRunning || !unlockDate || withdrawAmount.gt(maxWithdrawable)
        }
        data-cy="withdraw submit"
        type="submit"
      >
        {withdrawAmount.gt(0) ? 'Withdraw' : 'Enter Amount'}
      </Button>
    </Flex>
  );
}
