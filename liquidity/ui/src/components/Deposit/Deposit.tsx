import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Collapse,
  Flex,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { currency } from '@snx-v3/format';
import { formatNumber } from '@snx-v3/formatters';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useEthBalance } from '@snx-v3/useEthBalance';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import { useTransferableSynthetix } from '@snx-v3/useTransferableSynthetix';
import { useUSDC } from '@snx-v3/useUSDC';
import { WithdrawIncrease } from '@snx-v3/WithdrawIncrease';
import Wei from '@synthetixio/wei';
import React from 'react';
import { ChangeStat } from '../ChangeStat/ChangeStat';
import { CollateralAlert } from '../CollateralAlert/CollateralAlert';
import { CRatioChangeStat } from '../CRatioBar/CRatioChangeStat';
import { TokenIcon } from '../TokenIcon/TokenIcon';
import { TransactionSummary } from '../TransactionSummary/TransactionSummary';

export function Deposit() {
  const [params] = useParams<PositionPageSchemaType>();

  const { collateralChange, setCollateralChange } = React.useContext(ManagePositionContext);
  const { network } = useNetwork();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { data: transferrableSnx } = useTransferableSynthetix();

  const isStataUSDC = useIsSynthStataUSDC({ tokenAddress: collateralType?.tokenAddress });

  const { data: collateralBalance } = useTokenBalance(collateralType?.tokenAddress);

  const { data: ethBalance } = useEthBalance();

  const price = useTokenPrice(collateralType?.symbol);
  const { data: stataUSDCRate } = useStaticAaveUSDCRate();
  const { data: USDCToken } = useUSDC();
  const { data: usdcBalance } = useTokenBalance(USDCToken?.address);

  const maxAmount = React.useMemo(() => {
    if (collateralType?.symbol === 'SNX' && liquidityPosition && transferrableSnx) {
      return liquidityPosition.availableCollateral.add(transferrableSnx.transferable);
    }
    if (collateralType?.symbol === 'WETH' && liquidityPosition && collateralBalance && ethBalance) {
      return liquidityPosition.availableCollateral.add(collateralBalance).add(ethBalance);
    }
    if (isStataUSDC && liquidityPosition && usdcBalance) {
      const stataAmount = liquidityPosition.availableCollateral.add(collateralBalance);
      return stataAmount.add(usdcBalance.div(stataUSDCRate));
    }
    if (collateralType?.symbol === 'USDC' && network?.preset === 'andromeda' && liquidityPosition) {
      return liquidityPosition.availableCollateral.add(usdcBalance);
    }

    if (liquidityPosition && collateralBalance) {
      return liquidityPosition.availableCollateral.add(collateralBalance);
    }

    return ZEROWEI;
  }, [
    collateralType?.symbol,
    liquidityPosition,
    transferrableSnx,
    collateralBalance,
    ethBalance,
    isStataUSDC,
    network?.preset,
    stataUSDCRate,
    usdcBalance,
  ]);

  const overAvailableBalance = collateralChange.gt(maxAmount);

  return (
    <Flex flexDirection="column" data-cy="deposit and lock collateral form">
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        Deposit and Lock Collateral
      </Text>
      <BorderBox display="flex" p={3} mb="6">
        <Flex alignItems="flex-start" flexDir="column" gap="1">
          <BorderBox display="flex" py={1.5} px={2.5}>
            <Text display="flex" gap={2} alignItems="center" fontWeight="600">
              <TokenIcon symbol={collateralType?.symbol} width={16} height={16} />
              {collateralType?.displaySymbol}
            </Text>
          </BorderBox>
          <Tooltip
            label={
              <Flex
                flexDirection="column"
                alignItems="flex-start"
                fontSize="xs"
                color="whiteAlpha.700"
              >
                <Amount
                  prefix="Unlocked Balance: "
                  value={liquidityPosition?.availableCollateral}
                />

                <Amount
                  prefix="Wallet Balance: "
                  value={
                    collateralType?.symbol === 'SNX'
                      ? transferrableSnx?.transferable
                      : collateralBalance
                  }
                />

                {isStataUSDC && usdcBalance && stataUSDCRate ? (
                  <>
                    <Amount prefix="USDC Balance: " value={usdcBalance} />
                    <Amount
                      prefix="(~"
                      value={usdcBalance.div(stataUSDCRate).mul(998).div(1000)}
                      suffix=" Static aUSDC)"
                    />
                  </>
                ) : null}

                {collateralType?.symbol === 'WETH' ? (
                  <Amount prefix="ETH Balance: " value={ethBalance} />
                ) : null}
              </Flex>
            }
          >
            <Text fontSize="12px" data-cy="balance amount">
              {isPendingLiquidityPosition ? 'Balance: ~' : null}
              {!isPendingLiquidityPosition && maxAmount ? (
                <>
                  <Amount prefix="Balance: " value={maxAmount} />
                  &nbsp;
                  <Text
                    as="span"
                    cursor="pointer"
                    onClick={() => setCollateralChange(maxAmount)}
                    color="cyan.500"
                    fontWeight={700}
                  >
                    Max
                  </Text>
                </>
              ) : null}
            </Text>
          </Tooltip>
        </Flex>
        <Flex flexDir="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              'data-cy': 'deposit amount input',
              'data-max': maxAmount?.toString(),
              min: 0,
            }}
            value={collateralChange}
            onChange={(value) => {
              setCollateralChange(value);
            }}
            max={maxAmount}
            min={ZEROWEI}
          />
          <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
            {price.gt(0) && <Amount prefix="$" value={collateralChange.abs().mul(price)} />}
          </Flex>
        </Flex>
      </BorderBox>
      {transferrableSnx?.collateral &&
        transferrableSnx?.collateral.gt(0) &&
        collateralType?.symbol === 'SNX' && (
          <CollateralAlert mb="6" tokenBalance={transferrableSnx.collateral} />
        )}
      <Collapse in={collateralChange.gt(0) && !overAvailableBalance} animateOpacity>
        <WithdrawIncrease />
      </Collapse>

      <Collapse in={isStataUSDC} animateOpacity>
        <Alert mb={6} status="info" borderRadius="6px">
          <AlertIcon />
          <AlertDescription>
            Deposit USDC and it will automatically wrap into Static aUSDC
          </AlertDescription>
        </Alert>
      </Collapse>

      {collateralType && liquidityPosition ? (
        <Collapse
          in={
            collateralChange.gt(0) &&
            collateralChange
              .add(liquidityPosition.collateralAmount)
              .lt(collateralType.minDelegationD18)
          }
          animateOpacity
        >
          <Alert mb={6} status="error" borderRadius="6px">
            <AlertIcon />
            <AlertDescription>
              Your deposit must be{' '}
              {formatNumber(parseFloat(collateralType.minDelegationD18.toString()))}{' '}
              {collateralType.symbol} or higher
            </AlertDescription>
          </Alert>
        </Collapse>
      ) : null}

      <Collapse in={overAvailableBalance} animateOpacity>
        <Alert mb={6} status="error" borderRadius="6px">
          <AlertIcon />
          <AlertDescription>
            You cannot Deposit and Lock more Collateral than your Balance amount
          </AlertDescription>
        </Alert>
      </Collapse>

      {collateralType && liquidityPosition ? (
        <Collapse
          in={
            collateralChange.abs().gt(0) &&
            !overAvailableBalance &&
            collateralChange
              .add(liquidityPosition.collateralAmount)
              .gte(collateralType.minDelegationD18)
          }
          animateOpacity
        >
          <TransactionSummary
            mb={6}
            items={[
              ...(liquidityPosition
                ? [
                    {
                      label: `Locked ${collateralType?.symbol}`,
                      value: (
                        <ChangeStat
                          value={liquidityPosition.collateralAmount}
                          newValue={liquidityPosition.collateralAmount.add(collateralChange)}
                          formatFn={(val: Wei) => currency(val)}
                          hasChanges={collateralChange.abs().gt(0)}
                          size="sm"
                        />
                      ),
                    },
                  ]
                : []),
              ...(liquidityPosition && network?.preset !== 'andromeda'
                ? [
                    {
                      label: 'C-ratio',
                      value: (
                        <CRatioChangeStat
                          currentCollateral={liquidityPosition.collateralAmount}
                          currentDebt={liquidityPosition.debt}
                          collateralChange={collateralChange}
                          collateralPrice={liquidityPosition.collateralPrice}
                          debtChange={ZEROWEI}
                          size="sm"
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </Collapse>
      ) : null}

      <Button
        data-cy="deposit submit"
        type="submit"
        isDisabled={
          collateralChange.lte(0) ||
          maxAmount.eq(0) ||
          !collateralType ||
          !liquidityPosition ||
          collateralChange
            .add(liquidityPosition.collateralAmount)
            .lt(collateralType.minDelegationD18) ||
          overAvailableBalance
        }
      >
        {collateralChange.lte(0) ? 'Enter Amount' : 'Deposit and Lock Collateral'}
      </Button>
    </Flex>
  );
}
