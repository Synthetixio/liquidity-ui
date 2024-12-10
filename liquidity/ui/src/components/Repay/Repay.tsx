import { Button, Flex, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { wei } from '@synthetixio/wei';
import { useContext } from 'react';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export function Repay() {
  const [params] = useParams<PositionPageSchemaType>();

  const { debtChange, setDebtChange } = useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: systemToken } = useSystemToken();
  const { data: systemTokenBalance } = useTokenBalance(systemToken?.address);

  const availableCollateral =
    systemTokenBalance && liquidityPosition
      ? systemTokenBalance.add(liquidityPosition.availableSystemToken)
      : undefined;

  const canSubmit =
    liquidityPosition &&
    liquidityPosition.debt.gt(0) &&
    availableCollateral &&
    availableCollateral.gte(debtChange.abs());

  return (
    <Flex flexDirection="column" data-cy="repay debt form">
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        Repay Debt
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
            <Flex gap="1" mr="3" cursor="pointer">
              <Text display="flex" alignItems="center" data-cy="current debt amount">
                {isPendingLiquidityPosition ? '~' : null}
                {!isPendingLiquidityPosition && liquidityPosition ? (
                  <>
                    <Amount prefix="Debt: $" value={liquidityPosition.debt} />
                    &nbsp;
                    {liquidityPosition.debt.gt(0) ? (
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
                    ) : null}
                  </>
                ) : null}
              </Text>
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
              <Amount prefix="$" value={debtChange.abs().mul(liquidityPosition.collateralPrice)} />
            ) : null}
          </Text>
        </Flex>
      </BorderBox>
      <Button data-cy="repay submit" type="submit" isDisabled={!canSubmit}>
        {debtChange.eq(0) ? 'Enter Amount' : 'Repay'}
      </Button>
    </Flex>
  );
}
