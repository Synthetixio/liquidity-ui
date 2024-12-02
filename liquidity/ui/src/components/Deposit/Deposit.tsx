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
import {
  getSpotMarketId,
  getUSDCOnBase,
  getWrappedStataUSDCOnBase,
  isBaseAndromeda,
} from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { AccountCollateralType } from '@snx-v3/useAccountCollateral';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useEthBalance } from '@snx-v3/useEthBalance';
import { useGetWrapperToken } from '@snx-v3/useGetUSDTokens';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import { useTransferableSynthetix } from '@snx-v3/useTransferableSynthetix';
import { WithdrawIncrease } from '@snx-v3/WithdrawIncrease';
import Wei from '@synthetixio/wei';
import { FC, useContext, useMemo } from 'react';
import { ChangeStat } from '../ChangeStat/ChangeStat';
import { CollateralAlert } from '../CollateralAlert/CollateralAlert';
import { CRatioChangeStat } from '../CRatioBar/CRatioChangeStat';
import { TokenIcon } from '../TokenIcon/TokenIcon';
import { TransactionSummary } from '../TransactionSummary/TransactionSummary';

export const DepositUi: FC<{
  accountCollateral?: AccountCollateralType;
  collateralChange: Wei;
  ethBalance?: Wei;
  snxBalance?: {
    transferable: Wei;
    collateral?: Wei;
  };
  tokenBalance?: Wei;
  displaySymbol: string;
  symbol: string;
  setCollateralChange: (val: Wei) => void;
  minDelegation?: Wei;
  currentCollateral: Wei;
  currentDebt: Wei;
  collateralPrice: Wei;
  isBase: boolean;
}> = ({
  accountCollateral,
  collateralChange,
  setCollateralChange,
  displaySymbol,
  symbol,
  tokenBalance,
  ethBalance,
  snxBalance,
  minDelegation,
  currentCollateral,
  currentDebt,
  collateralPrice,
  isBase,
}) => {
  const { network } = useNetwork();
  const price = useTokenPrice(symbol);
  const { data: stataUSDCRate } = useStaticAaveUSDCRate();
  const { data: usdcBalance } = useTokenBalance(getUSDCOnBase(network?.id));

  const isStataUSDC = symbol === 'stataUSDC';

  const stataUSDCBalance = useMemo(() => {
    if (!isStataUSDC || !stataUSDCRate) {
      return ZEROWEI;
    }

    return (usdcBalance?.div(stataUSDCRate) || ZEROWEI).mul(998).div(1000);
  }, [isStataUSDC, stataUSDCRate, usdcBalance]);

  const combinedTokenBalance = useMemo(() => {
    if (symbol === 'SNX') {
      return snxBalance?.transferable || ZEROWEI;
    }
    if (isStataUSDC) {
      return (tokenBalance || ZEROWEI).add(stataUSDCBalance);
    }
    if (symbol !== 'WETH') {
      return tokenBalance || ZEROWEI;
    }
    if (!tokenBalance || !ethBalance) {
      return ZEROWEI;
    }
    return tokenBalance.add(ethBalance);
  }, [symbol, isStataUSDC, tokenBalance, ethBalance, snxBalance?.transferable, stataUSDCBalance]);

  const maxAmount =
    combinedTokenBalance && accountCollateral?.availableCollateral
      ? combinedTokenBalance.add(accountCollateral.availableCollateral)
      : ZEROWEI;

  const txSummaryItems = useMemo(() => {
    const items = [
      {
        label: 'Locked ' + symbol,
        value: (
          <ChangeStat
            value={currentCollateral}
            newValue={currentCollateral.add(collateralChange)}
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
  }, [collateralChange, collateralPrice, currentCollateral, currentDebt, isBase, symbol]);

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
              <TokenIcon symbol={symbol} width={16} height={16} />
              {displaySymbol}
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
                  <Amount value={accountCollateral?.availableCollateral} />
                </Flex>
                <Flex gap="1">
                  <Text>Wallet Balance:</Text>
                  <Amount value={symbol === 'SNX' ? snxBalance?.transferable : tokenBalance} />
                </Flex>
                {isStataUSDC && (
                  <Flex gap="1">
                    <Text>USDC Balance:</Text>
                    <Amount value={usdcBalance} />
                    <Amount prefix="(~" value={stataUSDCBalance} suffix=" Static aUSDC)" />
                  </Flex>
                )}
                {symbol === 'WETH' ? (
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
      {snxBalance?.collateral && snxBalance?.collateral.gt(0) && symbol === 'SNX' && (
        <CollateralAlert mb="6" tokenBalance={snxBalance.collateral} />
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

      {minDelegation ? (
        <Collapse
          in={collateralChange.gt(0) && collateralChange.add(currentCollateral).lt(minDelegation)}
          animateOpacity
        >
          <Alert mb={6} status="error" borderRadius="6px">
            <AlertIcon />
            <AlertDescription>
              Your deposit must be {formatNumber(parseFloat(minDelegation.toString()))} {symbol} or
              higher
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

      {minDelegation ? (
        <Collapse
          in={
            collateralChange.abs().gt(0) &&
            !overAvailableBalance &&
            collateralChange.add(currentCollateral).gte(minDelegation)
          }
          animateOpacity
        >
          <TransactionSummary mb={6} items={txSummaryItems} />
        </Collapse>
      ) : null}

      <Button
        data-cy="deposit submit"
        type="submit"
        isDisabled={
          !minDelegation ||
          collateralChange.lte(0) ||
          combinedTokenBalance === undefined ||
          collateralChange.add(currentCollateral).lt(minDelegation) ||
          overAvailableBalance
        }
      >
        {collateralChange.lte(0) ? 'Enter Amount' : 'Deposit and Lock Collateral'}
      </Button>
    </Flex>
  );
};

export const Deposit = ({ liquidityPosition }: { liquidityPosition?: LiquidityPosition }) => {
  const [params] = useParams<PositionPageSchemaType>();

  const { collateralChange, setCollateralChange } = useContext(ManagePositionContext);
  const { network } = useNetwork();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: transferrableSnx } = useTransferableSynthetix();
  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const isStataUSDC =
    collateralType?.address.toLowerCase() === getWrappedStataUSDCOnBase().toLowerCase();

  const { data: wrapperToken } = useGetWrapperToken(getSpotMarketId(params.collateralSymbol));

  // TODO: This will need refactoring
  const balanceAddress = isBase
    ? isStataUSDC
      ? getUSDCOnBase(network?.id)
      : wrapperToken
    : collateralType?.tokenAddress;

  const { data: tokenBalance } = useTokenBalance(balanceAddress);

  const { data: ethBalance } = useEthBalance();

  return (
    <DepositUi
      accountCollateral={liquidityPosition?.accountCollateral}
      displaySymbol={collateralType?.displaySymbol || ''}
      tokenBalance={tokenBalance}
      snxBalance={transferrableSnx}
      ethBalance={ethBalance}
      symbol={collateralType?.symbol || ''}
      setCollateralChange={setCollateralChange}
      collateralChange={collateralChange}
      minDelegation={collateralType?.minDelegationD18}
      currentCollateral={liquidityPosition?.collateralAmount ?? ZEROWEI}
      currentDebt={liquidityPosition?.debt ?? ZEROWEI}
      collateralPrice={liquidityPosition?.collateralPrice ?? ZEROWEI}
      isBase={isBase}
    />
  );
};
