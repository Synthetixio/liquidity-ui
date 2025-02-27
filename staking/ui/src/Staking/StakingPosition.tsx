import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { LogoIcon } from '@snx-v3/icons';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { LoanChart } from './LoanChart';
import { useClosePositionNewPool } from './useClosePositionNewPool';
import { useCurrentLoanedAmount } from './useCurrentLoanedAmount';
import { useLoan } from './useLoan';
import { usePositionCollateral } from './usePositionCollateral';

export function StakingPosition() {
  const { data: loanedAmount, isPending: isPendingLoanedAmount } = useCurrentLoanedAmount();
  const { data: loan, isPending: isPendingLoan } = useLoan();
  const { data: positionCollateral, isPending: isPendingPositionCollateral } =
    usePositionCollateral();
  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');
  const { isReady: isReadyClosePosition, mutation: closePosition } = useClosePositionNewPool();

  return (
    <Flex
      direction="column"
      borderColor="gray.900"
      borderWidth="1px"
      borderRadius="5px"
      bg="navy.700"
      p={6}
      gap={9}
    >
      <Box>
        <Flex direction="row" flexWrap="wrap" justifyContent="space-between" alignItems="center">
          <Heading as={Flex} alignItems="center" gap={4}>
            <LogoIcon />
            <Text lineHeight="20px" fontSize="14px" color="gray.500" fontWeight={500}>
              SNX 420 Pool
            </Text>
          </Heading>
        </Flex>
        <Text mt={3} color="gray.50" maxWidth="40em">
          Your position is fully delegated to Synthetix, and your debt is being forgiven
          automatically over time with zero risk of liquidation.
        </Text>
      </Box>

      <Flex direction={{ base: 'column', sm: 'row', lg: 'row', xl: 'row' }} flexWrap="wrap" gap={4}>
        <Flex
          order={{ base: 2, sm: 1, lg: 1, xl: 1 }}
          flex={{ base: 1, sm: 2, lg: 2, xl: 2 }}
          width="100%"
          borderColor="gray.900"
          borderWidth="1px"
          borderRadius="5px"
          bg="navy.900"
          p={6}
          direction="column"
          gap={6}
        >
          <Flex gap={6} direction={{ base: 'column', sm: 'column', lg: 'row', xl: 'row' }}>
            <Flex
              flex={{ base: 1, sm: 2, lg: 2, xl: 2 }}
              direction="column"
              minWidth="400px"
              gap={6}
              p={3}
            >
              <Flex minWidth="120px" direction="column" gap={3}>
                <Heading fontSize="20px" lineHeight="1.75rem" color="gray.50" fontWeight={700}>
                  Debt Burned
                </Heading>

                {isPendingLoanedAmount || isPendingLoan || isPendingSnxPrice ? (
                  <Text as="span" color="gray.50" fontSize="1.25em">
                    ~
                  </Text>
                ) : (
                  <Box>
                    <Text as="span" color="gray.50" fontSize="1.25em">
                      {loan && loanedAmount ? (
                        <Amount prefix="$" value={wei(loan.loanAmount.sub(loanedAmount))} />
                      ) : null}
                    </Text>
                    <Text as="span" color="gray.500" fontSize="1.25em">
                      {loan ? <Amount prefix=" / $" value={wei(loan.loanAmount)} /> : null}
                    </Text>
                  </Box>
                )}
              </Flex>
              <Box>
                <LoanChart
                  loan={loan ? wei(loan.loanAmount).toNumber() : 100}
                  startTime={loan ? parseInt(loan.startTime.toString()) : 0}
                  duration={365 * 24 * 60 * 60}
                  pointsCount={50}
                />
              </Box>
            </Flex>
          </Flex>
        </Flex>
        <Flex
          order={{ base: 1, sm: 1, lg: 1, xl: 1 }}
          flex={{ base: 1, sm: 1, lg: 1, xl: 1 }}
          width="100%"
          direction="column"
          borderColor="gray.900"
          borderWidth="1px"
          borderRadius="5px"
          p={3}
          gap={3}
          justifyContent="space-between"
        >
          <Flex minWidth="120px" direction="column" gap={3} textAlign="center">
            <Text color="gray.500">Account Balance</Text>
            <Box>
              <Text color="gray.50" fontSize="1.25em">
                {isPendingPositionCollateral || isPendingSnxPrice ? '~' : null}
                {!(isPendingPositionCollateral || isPendingSnxPrice) &&
                positionCollateral &&
                snxPrice ? (
                  <Amount value={wei(positionCollateral)} suffix=" SNX" />
                ) : null}
              </Text>
              <Text color="gray.500" fontSize="1.0em">
                {isPendingPositionCollateral || isPendingSnxPrice ? '~' : null}
                {!(isPendingPositionCollateral || isPendingSnxPrice) &&
                positionCollateral &&
                snxPrice ? (
                  <Amount prefix="$" value={wei(positionCollateral).mul(snxPrice)} />
                ) : null}
              </Text>
            </Box>
            <Button
              width="100%"
              variant="outline"
              isLoading={closePosition.isPending}
              isDisabled={!(isReadyClosePosition && !closePosition.isPending)}
              onClick={() => closePosition.mutateAsync()}
            >
              Withdraw
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
