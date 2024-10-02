import { ArrowBackIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Collapse,
  Divider,
  Flex,
  Link,
  ListItem,
  Text,
  Tooltip,
  UnorderedList,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCombinedTokenBalance } from '@snx-v3/useCombinedTokenBalance';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { WithdrawIncrease } from '@snx-v3/WithdrawIncrease';
import { wei } from '@synthetixio/wei';
import { useContext, useState } from 'react';
import { MigrationBanner } from '../Migration/MigrationBanner';
import { TokenIcon } from '../TokenIcon';

export function InitialDeposit({
  submit,
  hasAccount,
  liquidityPosition,
}: {
  submit: () => void;
  hasAccount: boolean;
  liquidityPosition?: LiquidityPosition;
}) {
  const { collateralChange, setCollateralChange } = useContext(ManagePositionContext);
  const { network } = useNetwork();
  const { collateralSymbol } = useParams();
  const { data: collateralType } = useCollateralType(collateralSymbol);
  const { data: combinedTokenBalance } = useCombinedTokenBalance(collateralType);
  const maxAmount = combinedTokenBalance?.balance || wei(0);

  const [step, setStep] = useState(0);
  return (
    <Flex flexDirection="column">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        {step > 0 && <ArrowBackIcon cursor="pointer" onClick={() => setStep(0)} mr={2} />}
        Open Liquidity Position
      </Text>
      <Divider my={5} bg="gray.900" />
      {step === 0 && (
        <>
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
                  <Text
                    display="flex"
                    gap={2}
                    alignItems="center"
                    fontWeight="600"
                    whiteSpace="nowrap"
                  >
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
                  {combinedTokenBalance?.main?.price ? (
                    <Amount
                      prefix="$"
                      value={collateralChange.abs().mul(combinedTokenBalance.main.price)}
                    />
                  ) : (
                    '-'
                  )}
                </Flex>
              </Flex>
            </Flex>
          </BorderBox>
          {collateralType?.symbol === 'SNX' && network
            ? [MAINNET.id, SEPOLIA.id].includes(network.id) && (
                <MigrationBanner network={network} type="alert" />
              )
            : null}

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
          <Button
            data-cy="deposit submit"
            onClick={() => {
              if (hasAccount) {
                submit();
              } else {
                setStep(1);
              }
            }}
            isDisabled={
              !collateralType ||
              (collateralType &&
                (collateralChange.lte(0) ||
                  collateralChange.lt(collateralType.minDelegationD18))) ||
              !combinedTokenBalance ||
              collateralChange.gt(maxAmount)
            }
          >
            {collateralChange.lte(0) ? 'Enter Amount' : 'Deposit & Lock'}
          </Button>
        </>
      )}
      {step === 1 && (
        <>
          <Text>
            In order to open a position on Synthetix Liquidity, you need an Account. It’s a one time
            action needed that you won’t have to reproduce for the next positions. Accounts are
            represented as ERC-721 compliant tokens (NFTs). Read more about it in the{' '}
            <Link
              href="https://docs.synthetix.io/v/synthetix-v3-user-documentation"
              target="_blank"
              color="cyan.500"
            >
              Synthetix V3 Documentation
            </Link>
          </Text>
          <br />
          <UnorderedList>
            <ListItem>Transferable like any NFT</ListItem>
            <br />
            <ListItem>Improve security by delegating permissions</ListItem>
            <br />
            <ListItem>Simplify collaborative liquidity positions management</ListItem>
          </UnorderedList>
          <Button
            onClick={() => {
              submit();
              setStep(0);
            }}
            mt={8}
          >
            Accept & Continue
          </Button>
        </>
      )}
    </Flex>
  );
}
