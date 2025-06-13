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
import { ChangeStat } from '@snx-v3/ChangeStat';
import { ZEROWEI } from '@snx-v3/constants';
import { CRatioChangeStat } from '@snx-v3/CRatioBar';
import { currency } from '@snx-v3/format';
import { formatNumber } from '@snx-v3/formatters';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { TransactionSummary } from '@snx-v3/TransactionSummary';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useEthBalance } from '@snx-v3/useEthBalance';
import { useIsAndromedaStataUSDC } from '@snx-v3/useIsAndromedaStataUSDC';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import { useTransferableSynthetix } from '@snx-v3/useTransferableSynthetix';
import { useUSDC } from '@snx-v3/useUSDC';
import { DepositsIncreaseTimeout } from '@snx-v3/WithdrawIncrease';
import { Wei } from '@synthetixio/wei';
import React from 'react';

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

  const isAndromedaStataUSDC = useIsAndromedaStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
  });

  const { data: collateralBalance } = useTokenBalance(collateralType?.tokenAddress);

  const { data: ethBalance } = useEthBalance();

  const price = useTokenPrice(collateralType?.symbol);
  const { data: USDCToken } = useUSDC();
  const { data: usdcBalance, isPending: isPendingUsdcBalance } = useTokenBalance(
    USDCToken?.address
  );

  const maxAmount = React.useMemo(() => {
    if (collateralType?.symbol === 'SNX') {
      return (
        ZEROWEI
          //
          .add(transferrableSnx ? transferrableSnx.transferable : ZEROWEI)
          .add(liquidityPosition ? liquidityPosition.availableCollateral : ZEROWEI)
      );
    }

    if (collateralType?.symbol === 'WETH') {
      return (
        ZEROWEI
          //
          .add(ethBalance ?? ZEROWEI)
          .add(collateralBalance ?? ZEROWEI)
          .add(liquidityPosition ? liquidityPosition.availableCollateral : ZEROWEI)
      );
    }

    if (network?.preset === 'andromeda') {
      return (
        ZEROWEI
          //
          .add(usdcBalance ? usdcBalance : ZEROWEI)
      );
    }

    return (
      ZEROWEI
        //
        .add(collateralBalance ?? ZEROWEI)
        .add(liquidityPosition ? liquidityPosition.availableCollateral : ZEROWEI)
    );
  }, [
    collateralType?.symbol,
    liquidityPosition,
    transferrableSnx,
    collateralBalance,
    ethBalance,
    usdcBalance,
    network?.preset,
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
              <TokenIcon
                symbol={collateralType?.symbol ?? params.collateralSymbol}
                width={16}
                height={16}
              />
              {collateralType?.displaySymbol ?? params.collateralSymbol}
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
                {network?.preset === 'andromeda' ? (
                  <>
                    {isPendingUsdcBalance ? (
                      'Wallet Balance: ~'
                    ) : (
                      <Amount prefix="Wallet Balance: " value={usdcBalance} />
                    )}
                  </>
                ) : null}

                {network?.preset !== 'andromeda' ? (
                  <>
                    {isPendingLiquidityPosition ? (
                      'Unlocked Balance: ~'
                    ) : (
                      <Amount
                        prefix="Unlocked Balance: "
                        value={liquidityPosition?.availableCollateral}
                      />
                    )}

                    <Amount
                      prefix="Wallet Balance: "
                      value={
                        collateralType?.symbol === 'SNX'
                          ? transferrableSnx?.transferable
                          : collateralBalance
                      }
                    />

                    {collateralType?.symbol === 'WETH' ? (
                      <Amount prefix="ETH Balance: " value={ethBalance} />
                    ) : null}
                  </>
                ) : null}
              </Flex>
            }
          >
            <Text fontSize="12px" data-cy="balance amount">
              {params.accountId && isPendingLiquidityPosition ? 'Balance: ~' : null}
              {(!params.accountId || (params.accountId && !isPendingLiquidityPosition)) &&
              maxAmount ? (
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
            <Amount prefix="$" value={collateralChange.abs().mul(price)} />
          </Flex>
        </Flex>
      </BorderBox>

      <Collapse in={collateralChange.gt(0) && !overAvailableBalance} animateOpacity unmountOnExit>
        <DepositsIncreaseTimeout />
      </Collapse>

      <Collapse in={isAndromedaStataUSDC} animateOpacity unmountOnExit>
        <Alert mb={6} status="info" borderRadius="6px">
          <AlertIcon />
          <AlertDescription>
            Deposit USDC and it will automatically wrap into Static aUSDC
          </AlertDescription>
        </Alert>
      </Collapse>

      {collateralType && (liquidityPosition || !params.accountId) ? (
        <Collapse
          in={
            collateralChange.gt(0) &&
            collateralChange
              .add(liquidityPosition ? liquidityPosition.collateralAmount : ZEROWEI)
              .lt(collateralType.minDelegationD18)
          }
          animateOpacity
          unmountOnExit
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

      <Collapse in={overAvailableBalance} animateOpacity unmountOnExit>
        <Alert mb={6} status="error" borderRadius="6px">
          <AlertIcon />
          <AlertDescription>
            You cannot Deposit and Lock more Collateral than your Balance amount
          </AlertDescription>
        </Alert>
      </Collapse>

      <Collapse in={true} animateOpacity unmountOnExit>
        <Alert mb={6} status="error" borderRadius="6px">
          <AlertIcon />
          <AlertDescription>Depositing is disabled.</AlertDescription>
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
          unmountOnExit
        >
          <TransactionSummary
            mb={6}
            items={[
              ...(liquidityPosition
                ? [
                    {
                      label: `Locked ${collateralType?.displaySymbol ?? params.collateralSymbol}`,
                      value: (
                        <ChangeStat
                          value={liquidityPosition.collateralAmount}
                          newValue={liquidityPosition.collateralAmount.add(collateralChange)}
                          formatFn={(val?: Wei) => currency(val ?? ZEROWEI)}
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
        isDisabled={true}
        onClick={() => {
          window?._paq?.push([
            'trackEvent',
            'liquidity',
            'v3_staking',
            `click_deposit_${collateralType?.symbol?.toLowerCase()}_v3`,
          ]);
        }}
      >
        {collateralChange.lte(0) ? 'Enter Amount' : 'Deposit and Lock Collateral'}
      </Button>
    </Flex>
  );
}
