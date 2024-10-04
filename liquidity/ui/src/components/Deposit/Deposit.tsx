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
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCombinedTokenBalance } from '@snx-v3/useCombinedTokenBalance';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { useTransferableSynthetix } from '@snx-v3/useTransferableSynthetix';
import { WithdrawIncrease } from '@snx-v3/WithdrawIncrease';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import { useContext } from 'react';
import { TokenIcon } from '../TokenIcon';
import { ChangeStat } from '../ChangeStat';
import { CRatioChangeStat } from '../CRatioBar/CRatioChangeStat';
import { TransactionSummary } from '../TransactionSummary/TransactionSummary';

export function Deposit({ liquidityPosition }: { liquidityPosition?: LiquidityPosition }) {
  const { collateralChange, setCollateralChange } = useContext(ManagePositionContext);
  const { collateralSymbol } = useParams();
  const { data: collateralType } = useCollateralType(collateralSymbol);
  const { data: transferrableSnx } = useTransferableSynthetix();
  const { data: combinedTokenBalance } = useCombinedTokenBalance(collateralType);
  const maxAmount = combinedTokenBalance?.balance || wei(0);
  const overAvailableBalance = collateralChange.abs().gt(maxAmount);

  return (
    <Flex flexDirection="column">
      <Text color="gray.50" fontSize="sm" fontWeight="700" mb={2} whiteSpace="nowrap">
        Deposit & Lock Collateral
      </Text>
      <BorderBox display="flex" flexDirection="column" p={3} mb="6">
        <Flex alignItems="center">
          <Flex alignItems="flex-start" flexDir="column" gap="1">
            <BorderBox
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={1.5}
              px={2.5}
              width="fit-content"
            >
              <Text display="flex" gap={2} alignItems="center" fontWeight="600" whiteSpace="nowrap">
                <TokenIcon symbol={combinedTokenBalance?.main.symbol} width={16} height={16} />
                {combinedTokenBalance?.main.displayName}
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
                    {liquidityPosition?.accountCollateral?.availableCollateral ? (
                      <Amount value={liquidityPosition.accountCollateral.availableCollateral} />
                    ) : null}
                  </Flex>
                  <Flex gap="1">
                    <Text>Wallet Balance:</Text>
                    <Amount value={combinedTokenBalance?.main.balance} />
                  </Flex>
                  {combinedTokenBalance?.swap ? (
                    <Flex gap="1" key={combinedTokenBalance.swap.address}>
                      <Text>{combinedTokenBalance.swap.displayName} Balance:</Text>
                      <Amount value={combinedTokenBalance.swap.balance} />
                      <Amount
                        value={combinedTokenBalance.swap.estimatedBalance}
                        prefix="(~"
                        suffix={` ${combinedTokenBalance?.main.displayName})`}
                      />
                    </Flex>
                  ) : null}
                </Flex>
              }
            >
              <Text fontSize="12px">
                Balance: <Amount value={maxAmount} />
                {maxAmount?.gt(0) ? (
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
                ) : null}
              </Text>
            </Tooltip>
          </Flex>
          <Flex flexDir="column" flexGrow={1}>
            <NumberInput
              InputProps={{
                'data-cy': 'deposit amount input',
                'data-max': maxAmount?.toString(),
                type: 'number',
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
              {combinedTokenBalance?.main?.price.gt(0) ? (
                <Amount
                  prefix="$"
                  value={collateralChange.abs().mul(combinedTokenBalance?.main?.price)}
                />
              ) : (
                '-'
              )}
            </Flex>
          </Flex>
        </Flex>
      </BorderBox>

      {collateralType?.symbol === 'SNX' &&
      transferrableSnx?.collateral &&
      transferrableSnx.collateral.gt(0) ? (
        <Alert mb="6" borderLeftColor="cyan.500" borderRadius="6px">
          <AlertIcon color="cyan.500" />
          <Text color="white" fontFamily="heading" fontSize="16px" lineHeight="24px">
            You have a {transferrableSnx.collateral.toString(2)} SNX active staking position on V2.
            <Text as="span" color="cyan.500" cursor="pointer">
              &nbsp;Migrate to V3
            </Text>
          </Text>
        </Alert>
      ) : null}

      {collateralType ? (
        <Collapse
          in={
            collateralChange.gt(0) &&
            collateralChange.lte(maxAmount) &&
            collateralChange.gte(collateralType.minDelegationD18)
          }
          animateOpacity
        >
          <WithdrawIncrease />
        </Collapse>
      ) : null}

      {collateralType ? (
        <Collapse
          in={
            collateralChange.gt(0) &&
            collateralChange.lt(collateralType.minDelegationD18) &&
            collateralChange.lte(maxAmount)
          }
          animateOpacity
        >
          <Alert mb={6} status="error" borderRadius="6px">
            <AlertIcon />
            <AlertDescription>
              <Amount
                prefix="Your deposit must be "
                value={collateralType.minDelegationD18}
                suffix={` ${combinedTokenBalance?.main.displayName} or higher`}
              />
            </AlertDescription>
          </Alert>
        </Collapse>
      ) : null}

      {collateralChange && maxAmount ? (
        <Collapse in={collateralChange.gt(maxAmount)} animateOpacity>
          <Alert mb={6} status="error" borderRadius="6px">
            <AlertIcon />
            <AlertDescription>
              You cannot Deposit & Lock more Collateral than your Balance amount
            </AlertDescription>
          </Alert>
        </Collapse>
      ) : null}

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
              {
                label: 'Locked ' + combinedTokenBalance?.main.displayName,
                value: (
                  <ChangeStat
                    value={liquidityPosition.collateralAmount}
                    newValue={liquidityPosition.collateralAmount.add(collateralChange)}
                    formatFn={(val) => currency(val)}
                    hasChanges={collateralChange.abs().gt(0)}
                    size="sm"
                  />
                ),
              },
              ...(collateralType.issuanceRatioD18.lt(ethers.constants.MaxUint256)
                ? [
                    // Only display C-Ratio when we can borrow.
                    // Borrow is disabled when issuanceRatioD18 is MaxUint256
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
          !collateralType ||
          (collateralType &&
            (collateralChange.lte(0) || collateralChange.lt(collateralType.minDelegationD18))) ||
          !combinedTokenBalance ||
          collateralChange.gt(maxAmount)
        }
      >
        {collateralChange.lte(0) ? 'Enter Amount' : 'Deposit & Lock'}
      </Button>
    </Flex>
  );
}
