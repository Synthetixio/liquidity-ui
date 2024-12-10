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
import { Tooltip } from '@snx-v3/Tooltip';
import { useClaimAllRewards } from '@snx-v3/useClaimAllRewards';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useRewards } from '@snx-v3/useRewards';
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
          isDisabled={!(rewards && rewards.length > 0)}
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

            {params.accountId && !isPendingRewards && rewards && rewards.length === 0 ? (
              <Tr>
                <Td display="flex" alignItems="left" px={4} border="none" w="100%">
                  <Text color="gray.500" fontFamily="heading" fontSize="xs">
                    No Rewards Available
                  </Text>
                </Td>
              </Tr>
            ) : null}

            {params.accountId && !isPendingRewards && rewards && rewards.length > 0
              ? rewards.map(({ distributor, claimableAmount }) => (
                  <RewardsRow
                    key={distributor.address}
                    distributor={distributor}
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
