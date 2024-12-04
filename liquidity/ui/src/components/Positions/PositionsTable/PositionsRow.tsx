import { TimeIcon } from '@chakra-ui/icons';
import { Box, Button, Collapse, Fade, Flex, Td, Text, Tooltip, Tr, Link } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';
import { useNetwork } from '@snx-v3/useBlockchain';
import { LiquidityPositionType } from '@snx-v3/useLiquidityPositions';
import { makeSearch, useParams } from '@snx-v3/useParams';
import { useRewards } from '@snx-v3/useRewards';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import { useWithdrawTimer } from '@snx-v3/useWithdrawTimer';
import { useMemo } from 'react';
import { CRatioAmount } from '../../CRatioBar/CRatioAmount';
import { CRatioBadge } from '../../CRatioBar/CRatioBadge';
import { TokenIcon } from '../../TokenIcon/TokenIcon';
import { DebtAmount } from './DebtAmount';

interface PositionRow extends LiquidityPositionType {
  final: boolean;
  isBase: boolean;
  apr?: number;
  systemTokenSymbol?: string;
  isStataUSDC?: boolean;
}

export function PositionRow({
  poolId,
  collateralType,
  debt,
  final,
  cRatio,
  isBase,
  apr,
  collateralAmount,
  availableCollateral,
  accountId,
  isStataUSDC,
}: PositionRow) {
  const [params, setParams] = useParams();

  const { data: rewardsData } = useRewards({
    poolId,
    collateralSymbol: collateralType?.symbol,
    accountId,
  });
  const { network } = useNetwork();
  const collateralPrice = useTokenPrice(collateralType.symbol);
  const { minutes, hours, isRunning } = useWithdrawTimer(accountId);
  const { data: stataUSDCAPR } = useStataUSDCApr(network?.id, network?.preset);
  const stataUSDCAPRParsed = stataUSDCAPR || 0;

  const hasRewards = useMemo(
    () => (rewardsData || []).reduce((curr, acc) => curr + acc.claimableAmount.toNumber(), 0) > 0,
    [rewardsData]
  );

  return (
    <Tr borderBottomWidth={final ? 'none' : '1px'}>
      <Td border="none">
        <Fade in>
          <Flex
            as={Link}
            href={`?${makeSearch({
              page: 'position',
              collateralSymbol: collateralType.symbol,
              poolId,
              manageAction: debt.gt(0) ? 'repay' : 'claim',
              accountId: params.accountId,
            })}`}
            onClick={(e) => {
              e.preventDefault();
              setParams({
                page: 'position',
                collateralSymbol: collateralType.symbol,
                poolId,
                manageAction: debt.gt(0) ? 'repay' : 'claim',
                accountId: params.accountId,
              });
            }}
            alignItems="center"
            textDecoration="none"
            _hover={{ textDecoration: 'none' }}
          >
            <TokenIcon symbol={collateralType.symbol} />
            <Flex flexDirection="column" ml={3}>
              <Text
                color="white"
                fontWeight={700}
                lineHeight="1.25rem"
                fontFamily="heading"
                fontSize="sm"
              >
                {collateralType.symbol}
              </Text>
              <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
                {collateralType.displaySymbol}
              </Text>
            </Flex>
          </Flex>
        </Fade>
      </Td>
      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          <Text color="white" lineHeight="1.25rem" fontFamily="heading" fontSize="sm">
            {collateralPrice.gt(0) && (
              <Amount prefix="$" value={collateralAmount.mul(collateralPrice)} />
            )}
          </Text>
          <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
            <Amount value={collateralAmount} suffix={` ${collateralType.symbol.toString()}`} />
          </Text>
        </Flex>
      </Td>
      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          <Text
            display="flex"
            alignItems="center"
            color="white"
            lineHeight="1.25rem"
            fontFamily="heading"
            fontSize="sm"
            gap={1.5}
          >
            {collateralPrice.gt(0) && (
              <Amount prefix="$" value={availableCollateral.mul(collateralPrice)} />
            )}

            {availableCollateral.gt(0) && isRunning && (
              <Tooltip label={`Withdrawal available in ${hours}H${minutes}M`}>
                <TimeIcon />
              </Tooltip>
            )}
          </Text>
          <Box color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
            {availableCollateral.gt(0) && !isRunning ? (
              <Link
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: collateralType.symbol,
                  poolId,
                  manageAction: 'withdraw',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: collateralType.symbol,
                    poolId,
                    manageAction: 'withdraw',
                    accountId: params.accountId,
                  });
                }}
                color="cyan.500"
                fontFamily="heading"
                fontSize="0.75rem"
                lineHeight="1rem"
              >
                Withdraw
              </Link>
            ) : (
              <Amount value={availableCollateral} suffix={` ${collateralType.symbol.toString()}`} />
            )}
          </Box>
        </Flex>
      </Td>
      <Td border="none">
        <Fade in>
          <Flex flexDirection="column" alignItems="flex-end">
            <Text color="white" lineHeight="1.25rem" fontFamily="heading" fontSize="sm">
              {apr && apr > 0
                ? (isStataUSDC ? apr + stataUSDCAPRParsed : apr).toFixed(2).concat('%')
                : '-'}
            </Text>
            {hasRewards ? (
              <Link
                color="cyan.500"
                fontFamily="heading"
                fontSize="0.75rem"
                lineHeight="1rem"
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: collateralType.symbol,
                  poolId,
                  manageAction: 'deposit',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: collateralType.symbol,
                    poolId,
                    manageAction: 'deposit',
                    accountId: params.accountId,
                  });
                }}
              >
                Claim Rewards
              </Link>
            ) : null}
          </Flex>
        </Fade>
      </Td>

      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          <DebtAmount
            debt={debt}
            showPNL={isBase}
            lineHeight="1.25rem"
            fontFamily="heading"
            fontSize="sm"
          />
          <Collapse in={debt.gt(0) || debt.lt(0)}>
            {debt.gt(0) ? (
              <Link
                color="cyan.500"
                fontFamily="heading"
                fontSize="0.75rem"
                lineHeight="1rem"
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: collateralType.symbol,
                  poolId,
                  manageAction: 'repay',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: collateralType.symbol,
                    poolId,
                    manageAction: 'repay',
                    accountId: params.accountId,
                  });
                }}
              >
                Repay Debt
              </Link>
            ) : null}
            {debt.lt(0) ? (
              <Link
                color="cyan.500"
                fontFamily="heading"
                fontSize="0.75rem"
                lineHeight="1rem"
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: collateralType.symbol,
                  poolId,
                  manageAction: 'claim',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: collateralType.symbol,
                    poolId,
                    manageAction: 'claim',
                    accountId: params.accountId,
                  });
                }}
              >
                Claim Credit
              </Link>
            ) : null}
          </Collapse>
        </Flex>
      </Td>
      {!isBase && (
        <Td border="none">
          <Fade in>
            <Flex flexDirection="column" alignItems="flex-end">
              <Text color="white" fontSize="sm" lineHeight="1.25rem" fontFamily="heading">
                <CRatioAmount value={cRatio.toNumber() * 100} />
              </Text>
              <CRatioBadge
                cRatio={cRatio.toNumber() * 100}
                liquidationCratio={(collateralType?.liquidationRatioD18?.toNumber() || 0) * 100}
                targetCratio={(collateralType?.issuanceRatioD18.toNumber() || 0) * 100}
              />
            </Flex>
          </Fade>
        </Td>
      )}
      <Td border="none" pr={0}>
        <Flex justifyContent="flex-end">
          <Button
            as={Link}
            href={`?${makeSearch({
              page: 'position',
              collateralSymbol: collateralType.symbol,
              poolId,
              manageAction: 'deposit',
              accountId: params.accountId,
            })}`}
            onClick={(e) => {
              e.preventDefault();
              setParams({
                page: 'position',
                collateralSymbol: collateralType.symbol,
                poolId,
                manageAction: 'deposit',
                accountId: params.accountId,
              });
            }}
            fontSize="sm"
            lineHeight="1.25rem"
            height="2rem"
            fontWeight={700}
            pt="5px"
            pb="5px"
            pl="12px"
            pr="12px"
            borderWidth="1px"
            borderColor="gray.900"
            borderRadius="4px"
            textDecoration="none"
            _hover={{ textDecoration: 'none' }}
          >
            Manage
          </Button>
        </Flex>
      </Td>
    </Tr>
  );
}
