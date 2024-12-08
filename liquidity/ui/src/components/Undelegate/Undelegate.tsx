import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Collapse,
  Flex,
  Link,
  Text,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { currency } from '@snx-v3/format';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { useAccountCollateral } from '@snx-v3/useAccountCollateral';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { makeSearch, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePoolConfiguration } from '@snx-v3/usePoolConfiguration';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import { useWithdrawTimer } from '@snx-v3/useWithdrawTimer';
import { validatePosition } from '@snx-v3/validatePosition';
import Wei, { wei } from '@synthetixio/wei';
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { ChangeStat } from '../ChangeStat/ChangeStat';
import { CRatioChangeStat } from '../CRatioBar/CRatioChangeStat';
import { TokenIcon } from '../TokenIcon/TokenIcon';
import { TransactionSummary } from '../TransactionSummary/TransactionSummary';

export const UndelegateUi: FC<{
  collateralChange: Wei;
  currentCollateral?: Wei;
  minDelegation?: Wei;
  currentDebt?: Wei;
  max?: Wei;
  collateralPrice?: Wei;
  displaySymbol: string;
  symbol: string;
  setCollateralChange: (val: Wei) => void;
  isAnyMarketLocked?: boolean;
  isLoadingRequiredData: boolean;
  isBase: boolean;
  accountId: string | undefined;
  maxWithdrawable?: Wei;
}> = ({
  collateralChange,
  setCollateralChange,
  max,
  displaySymbol,
  symbol,
  currentCollateral,
  minDelegation,
  isLoadingRequiredData,
  isAnyMarketLocked,
  isBase,
  currentDebt,
  collateralPrice,
  accountId,
  maxWithdrawable,
}) => {
  const [params, setParams] = useParams<PositionPageSchemaType>();

  const price = useTokenPrice(symbol);

  const onMaxClick = useCallback(() => {
    if (!max) {
      return;
    }
    setCollateralChange(max.mul(-1));
  }, [max, setCollateralChange]);

  const { minutes, hours, isRunning } = useWithdrawTimer(accountId);

  const leftoverCollateral = currentCollateral?.add(collateralChange) || wei(0);
  const isValidLeftover =
    leftoverCollateral.gte(minDelegation || wei(0)) || leftoverCollateral.eq(0);

  const isInputDisabled = isAnyMarketLocked;
  const overAvailableBalance = max ? collateralChange.abs().gt(max) : false;
  const isSubmitDisabled =
    isLoadingRequiredData ||
    isAnyMarketLocked ||
    collateralChange.gte(0) ||
    !isValidLeftover ||
    overAvailableBalance;

  const txSummaryItems = useMemo(() => {
    const items = [
      {
        label: 'Locked ' + symbol,
        value: (
          <ChangeStat
            value={currentCollateral || ZEROWEI}
            newValue={leftoverCollateral}
            formatFn={(val: Wei) => currency(val)}
            hasChanges={collateralChange.abs().gt(0)}
            size="sm"
          />
        ),
      },
    ];

    if (isBase) {
      return items;
    }

    return [
      ...items,
      {
        label: 'C-ratio',
        value: (
          <CRatioChangeStat
            currentCollateral={currentCollateral}
            currentDebt={currentDebt}
            collateralChange={collateralChange}
            collateralPrice={collateralPrice}
            debtChange={ZEROWEI}
            size="sm"
          />
        ),
      },
    ];
  }, [
    collateralChange,
    collateralPrice,
    currentCollateral,
    currentDebt,
    isBase,
    leftoverCollateral,
    symbol,
  ]);

  return (
    <Flex flexDirection="column" data-cy="unlock collateral form">
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        Unlock Collateral
      </Text>
      <BorderBox display="flex" p={3} mb="6">
        <Flex alignItems="flex-start" flexDir="column" gap="1">
          <BorderBox display="flex" py={1.5} px={2.5}>
            <Text display="flex" gap={2} alignItems="center" fontWeight="600">
              <TokenIcon symbol={symbol} width={16} height={16} />
              {displaySymbol}
            </Text>
          </BorderBox>
          <Flex gap="1" fontSize="12px" data-cy="locked amount">
            <Amount prefix="Locked: " value={max} />
            {max?.gt(0) && (
              <Text
                as="span"
                cursor="pointer"
                onClick={onMaxClick}
                color="cyan.500"
                fontWeight={700}
              >
                Max
              </Text>
            )}
          </Flex>
        </Flex>
        <Flex flexDir="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              isDisabled: isInputDisabled,
              isRequired: true,
              'data-cy': 'undelegate amount input',
              'data-max': max?.toString(),
              type: 'number',
              min: 0,
            }}
            value={collateralChange.abs()}
            onChange={(val) => setCollateralChange(val.mul(-1))}
            max={max}
            min={ZEROWEI}
          />
          <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
            {price.gt(0) && <Amount prefix="$" value={collateralChange.abs().mul(price)} />}
          </Flex>
        </Flex>
      </BorderBox>
      <Collapse in={isInputDisabled} animateOpacity>
        <Alert mb={6} status="warning" borderRadius="6px">
          <AlertIcon />
          <Flex direction="column">
            <AlertTitle>Credit capacity reached</AlertTitle>
            <AlertDescription>
              One of the markets has reached its credit capacity and is currently in a locked state.
              You cannot unlock collateral from the pool at this time.
            </AlertDescription>
          </Flex>
        </Alert>
      </Collapse>

      <Collapse in={!isValidLeftover && !collateralChange.eq(0)} animateOpacity>
        <Alert mb={6} status="info" borderRadius="6px">
          <AlertIcon />
          <Flex direction="column">
            <AlertTitle>
              The minimal locked amount is <Amount value={minDelegation} suffix={` ${symbol}`} />
            </AlertTitle>
            <AlertDescription>
              You can close your position by removing all the collateral.
            </AlertDescription>
          </Flex>
        </Alert>
      </Collapse>

      <Collapse in={collateralChange.abs().gt(0) && isValidLeftover && isRunning} animateOpacity>
        <Alert status="warning" mb="6">
          <AlertIcon />
          <Text>
            You will be able to withdraw assets in {hours}H{minutes}M. Any account activity will
            reset this timer to 24H.
          </Text>
        </Alert>
      </Collapse>

      <Collapse
        in={collateralChange.abs().gt(0) && isValidLeftover && !isRunning && maxWithdrawable?.gt(0)}
        animateOpacity
      >
        <Alert status="info" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You already have <Amount value={maxWithdrawable} suffix={` ${symbol}`} /> unlocked.
            &nbsp;
            <Link
              href={`?${makeSearch({
                page: 'position',
                collateralSymbol: symbol,
                poolId: params.poolId,
                manageAction: 'withdraw',
                accountId: params.accountId,
              })}`}
              onClick={(e) => {
                e.preventDefault();
                setParams({
                  page: 'position',
                  collateralSymbol: symbol,
                  poolId: params.poolId,
                  manageAction: 'withdraw',
                  accountId: params.accountId,
                });
              }}
              textDecoration="underline"
            >
              Withdraw
            </Link>{' '}
            before unlocking again as it will restart the 24h withdrawal timeout.
          </Text>
        </Alert>
      </Collapse>

      <Collapse in={currentDebt?.gt(0) && isBase} animateOpacity>
        <Alert status="error" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            To Unlock this amount, you need to
            <Link
              href={`?${makeSearch({
                page: 'position',
                collateralSymbol: symbol,
                poolId: params.poolId,
                manageAction: 'repay',
                accountId: params.accountId,
              })}`}
              onClick={(e) => {
                e.preventDefault();
                setParams({
                  page: 'position',
                  collateralSymbol: symbol,
                  poolId: params.poolId,
                  manageAction: 'repay',
                  accountId: params.accountId,
                });
              }}
              textDecoration="underline"
            >
              <Amount prefix=" repay" value={currentDebt} suffix={` ${symbol} to your position`} />
            </Link>
          </Text>
        </Alert>
      </Collapse>

      <Collapse in={collateralChange.abs().gt(0)} animateOpacity>
        <TransactionSummary mb={6} items={txSummaryItems} />
      </Collapse>

      <Button data-cy="undelegate submit" type="submit" isDisabled={isSubmitDisabled}>
        {collateralChange.gte(0) ? 'Enter Amount' : 'Unlock Collateral'}
      </Button>
    </Flex>
  );
};

export const Undelegate = ({ liquidityPosition }: { liquidityPosition?: LiquidityPosition }) => {
  const [params] = useParams<PositionPageSchemaType>();
  const { collateralChange, debtChange, setCollateralChange } = useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const poolConfiguration = usePoolConfiguration(params.poolId);
  const { network } = useNetwork();

  const collateralPrice = liquidityPosition?.collateralPrice;

  const { newDebt } = validatePosition({
    issuanceRatioD18: collateralType?.issuanceRatioD18,
    collateralAmount: liquidityPosition?.collateralAmount,
    collateralPrice,
    debt: liquidityPosition?.debt,
    collateralChange: collateralChange,
    debtChange: debtChange,
  });

  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const { data: systemToken } = useSystemToken();
  const { data: systemTokenBalance } = useAccountCollateral(params.accountId, systemToken?.address);

  const maxWithdrawable = useMemo(() => {
    if (isBase) {
      return (liquidityPosition?.accountCollateral.availableCollateral || ZEROWEI).add(
        systemTokenBalance?.availableCollateral || ZEROWEI
      );
    }
    return liquidityPosition?.accountCollateral.availableCollateral || ZEROWEI;
  }, [
    isBase,
    liquidityPosition?.accountCollateral.availableCollateral,
    systemTokenBalance?.availableCollateral,
  ]);

  // To get the max withdrawable collateral we look at the new debt and the issuance ratio.
  // This gives us the amount in dollar. We then divide by the collateral price.
  // To avoid the transaction failing due to small price deviations, we also apply a 2% buffer by multiplying with 0.98
  const max = (() => {
    if (!liquidityPosition || !collateralType) {
      return undefined;
    }
    const { collateralAmount, collateralValue } = liquidityPosition;

    if (isBase) {
      return collateralAmount;
    }

    // if debt is negative it's actually credit, which means we can undelegate all collateral
    if (newDebt.lte(0)) return collateralAmount;

    const minCollateralRequired = newDebt.mul(collateralType.liquidationRatioD18);

    if (collateralValue.lt(minCollateralRequired))
      // If you're below issuance ratio, you can't withdraw anything
      return wei(0);

    const maxWithdrawable = collateralValue.sub(minCollateralRequired).mul(0.98);

    return Wei.min(collateralAmount, maxWithdrawable);
  })();

  if (!collateralType) {
    return null;
  }

  return (
    <UndelegateUi
      displaySymbol={collateralType.displaySymbol}
      symbol={collateralType.symbol}
      minDelegation={collateralType.minDelegationD18}
      setCollateralChange={setCollateralChange}
      collateralChange={collateralChange}
      currentCollateral={liquidityPosition?.collateralAmount}
      currentDebt={liquidityPosition?.debt}
      max={max}
      isLoadingRequiredData={poolConfiguration.isLoading || !max}
      isAnyMarketLocked={poolConfiguration.data?.isAnyMarketLocked}
      isBase={isBase}
      collateralPrice={liquidityPosition?.collateralPrice}
      accountId={params.accountId}
      maxWithdrawable={maxWithdrawable}
    />
  );
};
