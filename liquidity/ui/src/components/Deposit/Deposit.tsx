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
  const { data: liquidityPosition, isPending: _isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { data: transferrableSnx } = useTransferableSynthetix();

  const { data: synthTokens } = useSynthTokens();
  const wrapperToken = React.useMemo(() => {
    if (synthTokens && collateralType) {
      return synthTokens.find((synth) => synth.address === collateralType.tokenAddress)?.token
        ?.address;
    }
  }, [collateralType, synthTokens]);

  const { data: stataUSDC } = useStaticAaveUSDC();

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  // TODO: This will need refactoring
  const balanceAddress =
    network?.preset === 'andromeda'
      ? isStataUSDC
        ? stataUSDC?.address
        : wrapperToken
      : collateralType?.tokenAddress;

  const { data: tokenBalance } = useTokenBalance(balanceAddress);

  const { data: ethBalance } = useEthBalance();

  const price = useTokenPrice(collateralType?.symbol);
  const { data: stataUSDCRate } = useStaticAaveUSDCRate();
  const { data: USDCToken } = useUSDC(network);
  const { data: usdcBalance } = useTokenBalance(USDCToken?.address, network);

  const stataUSDCBalance = React.useMemo(() => {
    if (!isStataUSDC || !stataUSDCRate) {
      return ZEROWEI;
    }

    return (usdcBalance?.div(stataUSDCRate) || ZEROWEI).mul(998).div(1000);
  }, [isStataUSDC, stataUSDCRate, usdcBalance]);

  const combinedTokenBalance = React.useMemo(() => {
    if (collateralType?.symbol === 'SNX') {
      return transferrableSnx?.transferable || ZEROWEI;
    }
    if (isStataUSDC) {
      return (tokenBalance || ZEROWEI).add(stataUSDCBalance);
    }
    if (collateralType?.symbol !== 'WETH') {
      return tokenBalance || ZEROWEI;
    }
    if (!tokenBalance || !ethBalance) {
      return ZEROWEI;
    }
    return tokenBalance.add(ethBalance);
  }, [
    collateralType?.symbol,
    isStataUSDC,
    tokenBalance,
    ethBalance,
    transferrableSnx?.transferable,
    stataUSDCBalance,
  ]);

  const maxAmount =
    combinedTokenBalance && liquidityPosition?.availableCollateral
      ? combinedTokenBalance.add(liquidityPosition.availableCollateral)
      : ZEROWEI;

  const overAvailableBalance = collateralChange.abs().gt(maxAmount);

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
                <Flex gap="1">
                  <Text>Unlocked Balance:</Text>
                  <Amount value={liquidityPosition?.availableCollateral} />
                </Flex>
                <Flex gap="1">
                  <Text>Wallet Balance:</Text>
                  <Amount
                    value={
                      collateralType?.symbol === 'SNX'
                        ? transferrableSnx?.transferable
                        : tokenBalance
                    }
                  />
                </Flex>
                {isStataUSDC && (
                  <Flex gap="1">
                    <Text>USDC Balance:</Text>
                    <Amount value={usdcBalance} />
                    <Amount prefix="(~" value={stataUSDCBalance} suffix=" Static aUSDC)" />
                  </Flex>
                )}
                {collateralType?.symbol === 'WETH' ? (
                  <Flex gap="1">
                    <Text>ETH Balance:</Text>
                    <Amount value={ethBalance} />
                  </Flex>
                ) : null}
              </Flex>
            }
          >
            <Text fontSize="12px" data-cy="balance amount">
              <Amount prefix="Balance: " value={maxAmount} />
              {maxAmount?.gt(0) && (
                <Text
                  as="span"
                  cursor="pointer"
                  onClick={() => {
                    if (!maxAmount) {
                      return;
                    }
                    setCollateralChange(maxAmount);
                  }}
                  color="cyan.500"
                  fontWeight={700}
                >
                  &nbsp;Max
                </Text>
              )}
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
          combinedTokenBalance === undefined ||
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
