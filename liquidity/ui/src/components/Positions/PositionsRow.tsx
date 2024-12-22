import { TimeIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Collapse,
  Fade,
  Flex,
  Image,
  Link,
  Td,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { DebtAmount, PnlAmount } from '@snx-v3/DebtAmount';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { useAccountCollateral } from '@snx-v3/useAccountCollateral';
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { type LiquidityPositionType } from '@snx-v3/useLiquidityPosition';
import { makeSearch, useParams } from '@snx-v3/useParams';
import { useWithdrawTimer } from '@snx-v3/useWithdrawTimer';
import { CRatioAmount } from '../CRatioBar/CRatioAmount';
import { CRatioBadge } from '../CRatioBar/CRatioBadge';
import lockIcon from './lock.svg';

export function PositionRow({
  liquidityPosition,
  apr,
}: {
  liquidityPosition: LiquidityPositionType;
  apr?: number;
}) {
  const [params, setParams] = useParams();
  useAccountCollateral({
    accountId: params.accountId,
    tokenAddress: liquidityPosition.collateralType.address,
  });
  const { network } = useNetwork();

  const { data: accountCollateral } = useAccountCollateral({
    accountId: params.accountId,
    tokenAddress: liquidityPosition.collateralType?.address,
  });

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: liquidityPosition.collateralType.tokenAddress,
    customNetwork: network,
  });

  const { minutes, hours, isRunning } = useWithdrawTimer(params.accountId);
  const { data: stataUSDCAPR } = useStataUSDCApr(network?.id, network?.preset);
  const stataUSDCAPRParsed = stataUSDCAPR || 0;

  return (
    <>
      <Td border="none">
        <Fade in>
          <Flex
            as={Link}
            href={`?${makeSearch({
              page: 'position',
              collateralSymbol: liquidityPosition.collateralType.symbol,
              manageAction: liquidityPosition.debt.gt(0) ? 'repay' : 'claim',
              accountId: params.accountId,
            })}`}
            onClick={(e) => {
              e.preventDefault();
              setParams({
                page: 'position',
                collateralSymbol: liquidityPosition.collateralType.symbol,
                manageAction: liquidityPosition.debt.gt(0) ? 'repay' : 'claim',
                accountId: params.accountId,
              });
            }}
            alignItems="center"
            textDecoration="none"
            _hover={{ textDecoration: 'none' }}
          >
            <TokenIcon symbol={liquidityPosition.collateralType.symbol} />
            <Flex flexDirection="column" ml={3}>
              <Text
                color="white"
                fontWeight={700}
                lineHeight="1.25rem"
                fontFamily="heading"
                fontSize="sm"
              >
                {liquidityPosition.collateralType.symbol}
              </Text>
              <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
                {liquidityPosition.collateralType.displaySymbol}
              </Text>
            </Flex>
          </Flex>
        </Fade>
      </Td>
      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          <Text
            display="flex"
            alignItems="center"
            gap={2}
            color="white"
            lineHeight="1.25rem"
            fontFamily="heading"
            fontSize="sm"
          >
            <Amount prefix="$" value={liquidityPosition.collateralValue} />
            <Tooltip
              label={
                <>
                  Including in &nbsp;
                  <Amount
                    value={accountCollateral?.totalLocked}
                    suffix={` ${liquidityPosition.collateralType?.displaySymbol}`}
                    showTooltip
                  />
                  &nbsp; Escrow that cannot be unlocked until the unlocking date has been reached
                </>
              }
            >
              <Image src={lockIcon} />
            </Tooltip>
          </Text>
          <Text color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
            <Amount
              value={liquidityPosition.collateralAmount}
              suffix={` ${liquidityPosition.collateralType.displaySymbol}`}
            />
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
            <Amount
              prefix="$"
              value={liquidityPosition.availableCollateral.mul(liquidityPosition.collateralPrice)}
            />

            {liquidityPosition.availableCollateral.gt(0) && isRunning && (
              <Tooltip label={`Withdrawal available in ${hours}H${minutes}M`}>
                <TimeIcon />
              </Tooltip>
            )}
          </Text>
          <Box color="gray.500" fontFamily="heading" fontSize="0.75rem" lineHeight="1rem">
            <Amount
              value={liquidityPosition.availableCollateral}
              suffix={` ${liquidityPosition.collateralType.displaySymbol}`}
            />{' '}
            {liquidityPosition.availableCollateral.gt(0) && !isRunning ? (
              <Link
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: liquidityPosition.collateralType.symbol,
                  manageAction: 'withdraw',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: liquidityPosition.collateralType.symbol,
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
            ) : null}
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
          </Flex>
        </Fade>
      </Td>

      <Td border="none">
        <Flex flexDirection="column" alignItems="flex-end">
          {network?.preset === 'andromeda' ? (
            <PnlAmount
              debt={liquidityPosition.debt}
              lineHeight="1.25rem"
              fontFamily="heading"
              fontSize="sm"
            />
          ) : (
            <DebtAmount
              debt={liquidityPosition.debt}
              lineHeight="1.25rem"
              fontFamily="heading"
              fontSize="sm"
            />
          )}
          <Collapse in={liquidityPosition.debt.gt(0) || liquidityPosition.debt.lt(0)}>
            {liquidityPosition.debt.gt(0) ? (
              <Link
                color="cyan.500"
                fontFamily="heading"
                fontSize="0.75rem"
                lineHeight="1rem"
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: liquidityPosition.collateralType.symbol,
                  manageAction: 'repay',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: liquidityPosition.collateralType.symbol,
                    manageAction: 'repay',
                    accountId: params.accountId,
                  });
                }}
              >
                Repay Debt
              </Link>
            ) : null}
            {liquidityPosition.debt.lt(0) ? (
              <Link
                color="cyan.500"
                fontFamily="heading"
                fontSize="0.75rem"
                lineHeight="1rem"
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: liquidityPosition.collateralType.symbol,
                  manageAction: 'claim',
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  setParams({
                    page: 'position',
                    collateralSymbol: liquidityPosition.collateralType.symbol,
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
      {network?.preset === 'andromeda' ? null : (
        <Td border="none">
          <Fade in>
            <Flex flexDirection="column" alignItems="flex-end">
              <Text color="white" fontSize="sm" lineHeight="1.25rem" fontFamily="heading">
                <CRatioAmount value={liquidityPosition.cRatio.toNumber() * 100} />
              </Text>
              <CRatioBadge
                cRatio={liquidityPosition.cRatio.toNumber() * 100}
                liquidationCratio={
                  liquidityPosition.collateralType.liquidationRatioD18
                    ? liquidityPosition.collateralType.liquidationRatioD18.toNumber() * 100
                    : 0
                }
                targetCratio={
                  liquidityPosition.collateralType.issuanceRatioD18
                    ? liquidityPosition.collateralType.issuanceRatioD18.toNumber() * 100
                    : 0
                }
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
              collateralSymbol: liquidityPosition.collateralType.symbol,
              manageAction: 'deposit',
              accountId: params.accountId,
            })}`}
            onClick={(e) => {
              e.preventDefault();
              setParams({
                page: 'position',
                collateralSymbol: liquidityPosition.collateralType.symbol,
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
    </>
  );
}
