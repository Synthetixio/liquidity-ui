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
import { formatNumber } from '@snx-v3/formatters';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { MAINNET, SEPOLIA, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useEthBalance } from '@snx-v3/useEthBalance';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import { useTransferableSynthetix } from '@snx-v3/useTransferableSynthetix';
import { useUSDC } from '@snx-v3/useUSDC';
import { WithdrawIncrease } from '@snx-v3/WithdrawIncrease';
import React from 'react';
import { MigrationBanner } from '../Migration/MigrationBanner';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export function InitialDeposit({
  submit,
  hasAccount,
}: {
  submit: () => void;
  hasAccount: boolean;
}) {
  const [params] = useParams<PositionPageSchemaType>();
  const { collateralChange, setCollateralChange } = React.useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const { data: transferrableSnx } = useTransferableSynthetix();
  const { data: synthTokens } = useSynthTokens();
  const synth = synthTokens?.find(
    (synth) =>
      collateralType?.tokenAddress?.toLowerCase() === synth?.address?.toLowerCase() ||
      collateralType?.tokenAddress?.toLowerCase() === synth?.token?.address.toLowerCase()
  );

  const { data: tokenBalance } = useTokenBalance(synth?.token?.address);

  const { data: ethBalance } = useEthBalance();

  const [step, setStep] = React.useState(0);
  const price = useTokenPrice(collateralType?.symbol);
  const { network } = useNetwork();
  const { data: stataUSDCRate } = useStaticAaveUSDCRate();

  const { data: USDCToken } = useUSDC(network);
  const { data: usdcBalance } = useTokenBalance(USDCToken?.address, network);

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  const stataUSDCBalance = React.useMemo(() => {
    if (!isStataUSDC || !stataUSDCRate) {
      return ZEROWEI;
    }

    return usdcBalance?.div(stataUSDCRate) || ZEROWEI;
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

  const maxAmount = React.useMemo(() => {
    return combinedTokenBalance && liquidityPosition
      ? combinedTokenBalance?.add(liquidityPosition.availableCollateral)
      : undefined;
  }, [liquidityPosition, combinedTokenBalance]);

  const overAvailableBalance = maxAmount ? collateralChange.gt(maxAmount) : false;

  return (
    <Flex flexDirection="column" data-cy="open liquidity position form">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        {step > 0 && <ArrowBackIcon cursor="pointer" onClick={() => setStep(0)} mr={2} />}
        Open Liquidity Position
      </Text>
      <Divider my={5} bg="gray.900" />
      {step === 0 && (
        <>
          <Text color="gray.50" fontSize="sm" fontWeight="700" mb={2}>
            Deposit and Lock Collateral
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
                        {isPendingLiquidityPosition ? (
                          '~'
                        ) : liquidityPosition ? (
                          <Amount value={liquidityPosition.availableCollateral} />
                        ) : null}
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
                  </Text>
                </Tooltip>
              </Flex>
              <Flex flexDir="column" flexGrow={1}>
                <NumberInput
                  InputProps={{
                    'data-cy': 'deposit amount input',
                    'data-max': combinedTokenBalance?.toString(),
                    type: 'number',
                    min: 0,
                  }}
                  value={collateralChange}
                  onChange={(value) => {
                    setCollateralChange(value);
                  }}
                  max={combinedTokenBalance}
                  min={ZEROWEI}
                />
                <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
                  {price.gt(0) && <Amount prefix="$" value={collateralChange.abs().mul(price)} />}
                </Flex>
              </Flex>
            </Flex>
          </BorderBox>
          {collateralType?.symbol === 'SNX' &&
            network &&
            [MAINNET.id, SEPOLIA.id].includes(network.id) && (
              <MigrationBanner network={network} type="alert" />
            )}
          <Collapse
            in={
              collateralType &&
              collateralChange.gt(0) &&
              !overAvailableBalance &&
              collateralChange.gte(collateralType.minDelegationD18)
            }
            animateOpacity
          >
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
          <Collapse
            in={
              collateralType &&
              collateralChange.lt(collateralType.minDelegationD18) &&
              !overAvailableBalance
            }
            animateOpacity
          >
            <Alert mb={6} status="error" borderRadius="6px">
              <AlertIcon />
              <AlertDescription>
                Your deposit must be{' '}
                {collateralType
                  ? formatNumber(parseFloat(collateralType.minDelegationD18.toString()))
                  : ''}{' '}
                {collateralType?.symbol} or higher
              </AlertDescription>
            </Alert>
          </Collapse>
          <Collapse in={overAvailableBalance} animateOpacity>
            <Alert mb={6} status="error" borderRadius="6px">
              <AlertIcon />
              <AlertDescription>
                You cannot Deposit and Lock more Collateral than your Balance amount
              </AlertDescription>
            </Alert>
          </Collapse>
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
              collateralChange.lte(0) ||
              combinedTokenBalance === undefined ||
              collateralChange.lt(collateralType.minDelegationD18) ||
              overAvailableBalance
            }
          >
            {collateralChange.lte(0) ? 'Enter Amount' : 'Deposit and Lock'}
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
