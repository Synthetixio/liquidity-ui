import { InfoIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
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
import { tokenOverrides } from '@snx-v3/constants';
import { Tooltip } from '@snx-v3/Tooltip';
import { useClaimAllRewards } from '@snx-v3/useClaimAllRewards';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useRewards } from '@snx-v3/useRewards';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import React from 'react';
import { AllRewardsModal } from './AllRewardsModal';
import { RewardsLoading } from './RewardsLoading';
import { RewardsRow } from './RewardsRow';

export function Rewards() {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: rewards, isPending: isPendingRewards } = useRewards({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralType,
  });
  const { exec: claimAll, txnState } = useClaimAllRewards({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralType,
  });

  const { data: synthTokens } = useSynthTokens();
  const groupedRewards = React.useMemo(() => {
    if (!rewards || !rewards.length) {
      return;
    }
    const map = new Map();
    rewards.forEach(({ distributor, claimableAmount }) => {
      const synthToken = synthTokens?.find(
        (synth) => synth.address.toLowerCase() === distributor.payoutToken.address.toLowerCase()
      );
      const token = synthToken && synthToken.token ? synthToken.token : distributor.payoutToken;
      const displaySymbol = tokenOverrides[token.address] ?? token.symbol;
      if (map.has(displaySymbol)) {
        map.set(displaySymbol, map.get(displaySymbol).add(claimableAmount));
      } else {
        map.set(displaySymbol, claimableAmount);
      }
    });
    return Array.from(map.entries())
      .map(([displaySymbol, claimableAmount]) => ({
        displaySymbol,
        claimableAmount,
      }))
      .filter(({ claimableAmount }) => claimableAmount.gt(0))
      .sort((a, b) => a.displaySymbol.localeCompare(b.displaySymbol))
      .sort((a, b) => b.claimableAmount.toNumber() - a.claimableAmount.toNumber());
  }, [rewards, synthTokens]);

  return (
    <BorderBox bg="navy.700" py={4} px={4} flexDir="column">
      <AllRewardsModal txnStatus={txnState.txnStatus} txnHash={txnState.txnHash} />
      <Flex alignItems="center" justifyContent="space-between">
        <Text color="gray.500" fontFamily="heading" lineHeight="4" fontSize="xs" mb="8px">
          Rewards
        </Text>
        <Button
          size="sm"
          variant="solid"
          isDisabled={!(groupedRewards && groupedRewards.length > 0)}
          _disabled={{
            bg: 'gray.900',
            backgroundImage: 'none',
            color: 'gray.500',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
          data-cy="claim rewards submit"
          onClick={() => claimAll()}
        >
          Claim
        </Button>
      </Flex>

      <TableContainer width="100%" mb="8px">
        <Table data-cy="rewards table">
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
            {!params.accountId ? (
              <Tr>
                <Td display="flex" alignItems="left" px={4} border="none" w="100%">
                  <Text color="gray.500" fontFamily="heading" fontSize="xs">
                    Create a Position to see your earnings
                  </Text>
                </Td>
              </Tr>
            ) : null}

            {params.accountId && isPendingRewards ? <RewardsLoading /> : null}

            {groupedRewards && groupedRewards.length === 0 ? (
              <Tr>
                <Td display="flex" alignItems="left" px={4} border="none" w="100%">
                  <Text color="gray.500" fontFamily="heading" fontSize="xs">
                    No Rewards Available
                  </Text>
                </Td>
              </Tr>
            ) : null}

            {groupedRewards && groupedRewards.length
              ? groupedRewards.map(({ displaySymbol, claimableAmount }) => (
                  <RewardsRow
                    key={displaySymbol}
                    displaySymbol={displaySymbol}
                    claimableAmount={claimableAmount}
                  />
                ))
              : null}
          </Tbody>
        </Table>
      </TableContainer>
    </BorderBox>
  );
}
