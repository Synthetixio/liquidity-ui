import { InfoIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FlexProps,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { Tooltip } from '@snx-v3/Tooltip';
import { useParams } from '@snx-v3/useParams';
import { useRewards } from '@snx-v3/useRewards';
import { RewardsLoading } from './RewardsLoading';
import { RewardsRow } from './RewardsRow';
import { useCallback, useMemo } from 'react';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { AllRewardsModal } from './AllRewardsModal';
import { useClaimAllRewards } from '@snx-v3/useClaimAllRewards';

export const Rewards = ({ ...props }: FlexProps) => {
  const { accountId, collateralSymbol, poolId } = useParams();
  const { data: collateralData } = useCollateralType(collateralSymbol);
  const { isPending, data: rewards } = useRewards({ poolId, collateralSymbol, accountId });

  const allRewards = useMemo(
    () =>
      rewards
        ?.map(({ distributorAddress, payoutTokenAddress, claimableAmount }) => ({
          poolId: poolId || '',
          collateralAddress: collateralData?.tokenAddress || '',
          accountId: accountId,
          distributorAddress: distributorAddress,
          amount: claimableAmount,
          payoutTokenAddress,
        }))
        .filter(({ amount }) => amount.gt(0)) || [],
    [accountId, collateralData?.tokenAddress, poolId, rewards]
  );

  const { exec: claimAll, txnState } = useClaimAllRewards(allRewards);

  const onClick = useCallback(() => {
    claimAll();
  }, [claimAll]);

  return (
    <BorderBox bg="navy.700" py={4} px={4} flexDir="column" {...props}>
      <AllRewardsModal
        rewards={(rewards || [])
          ?.filter((r) => r.claimableAmount.gt(0))
          .map(({ claimableAmount, displaySymbol }) => ({
            collateralSymbol: displaySymbol,
            amount: claimableAmount.toNumber(),
          }))}
        txnStatus={txnState.txnStatus}
        txnHash={txnState.txnHash}
      />
      <Flex alignItems="center" justifyContent="space-between">
        <Text color="gray.500" fontFamily="heading" lineHeight="4" fontSize="xs" mb="8px">
          Rewards
        </Text>
        <Button
          size="sm"
          variant="solid"
          isDisabled={!allRewards.length}
          _disabled={{
            bg: 'gray.900',
            backgroundImage: 'none',
            color: 'gray.500',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
          onClick={onClick}
        >
          Claim
        </Button>
      </Flex>

      <TableContainer width="100%" mb="8px">
        <Table>
          <Thead>
            <Tr borderBottom="1px solid #2D2D38">
              <Th
                textTransform="unset"
                color="gray.600"
                border="none"
                fontFamily="heading"
                fontSize="12px"
                lineHeight="16px"
                letterSpacing={0.6}
                fontWeight={700}
                px={4}
                py={3}
              >
                Rewards type
                <Tooltip label="Total rewards active for the Pool">
                  <InfoIcon ml={1} mb="1px" />
                </Tooltip>
              </Th>
              <Th
                textTransform="unset"
                color="gray.600"
                border="none"
                fontFamily="heading"
                fontSize="12px"
                lineHeight="16px"
                letterSpacing={0.6}
                fontWeight={700}
                px={4}
                py={3}
              >
                Earnings
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {isPending ? <RewardsLoading /> : null}
            {!isPending && rewards && rewards.length > 0
              ? rewards?.map((item) => (
                  <RewardsRow
                    key={item.address}
                    displaySymbol={item.displaySymbol}
                    claimableAmount={item.claimableAmount}
                    lifetimeClaimed={item.lifetimeClaimed}
                    distributorAddress={item.distributorAddress}
                  />
                ))
              : null}
            {!isPending && rewards && rewards.length === 0 ? (
              <Td display="flex" alignItems="left" px={4} border="none" w="100%">
                <Text color="gray.500" fontFamily="heading" fontSize="xs">
                  Create a Position to see your earnings
                </Text>
              </Td>
            ) : null}
          </Tbody>
        </Table>
      </TableContainer>
    </BorderBox>
  );
};
