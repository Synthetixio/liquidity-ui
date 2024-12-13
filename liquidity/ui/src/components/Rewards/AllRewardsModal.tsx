import { CheckIcon } from '@chakra-ui/icons';
import {
  Button,
  CircularProgress,
  Divider,
  Flex,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { tokenOverrides } from '@snx-v3/constants';
import { etherscanLink } from '@snx-v3/etherscanLink';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useRewards } from '@snx-v3/useRewards';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { WithdrawIncrease } from '@snx-v3/WithdrawIncrease';
import { Wei } from '@synthetixio/wei';
import React from 'react';

export function AllRewardsModal({
  txnStatus,
  txnHash,
}: {
  txnStatus?: string;
  txnHash: string | null;
}) {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: rewards } = useRewards({
    accountId: params.accountId,
    poolId: params.poolId,
    collateralType,
  });
  const { data: synthTokens } = useSynthTokens();

  const [isOpen, setIsOpen] = React.useState(false);

  const { network } = useNetwork();

  React.useEffect(() => {
    if (txnStatus === 'prompting') {
      setIsOpen(true);
    }
    if (txnStatus === 'error') {
      setIsOpen(false);
    }
    // Disable auto-close
    // if (txnStatus === 'success') {
    //   setTimeout(() => {
    //     setIsOpen(false);
    //   }, 1200);
    // }
  }, [txnStatus]);

  const groupedRewards = React.useMemo(() => {
    if (!rewards || !rewards.length) {
      return;
    }
    const map = new Map();
    rewards.forEach(({ distributor, claimableAmount }) => {
      const synthToken = synthTokens?.find(
        (synth) => synth.address.toUpperCase() === distributor.payoutToken.address.toUpperCase()
      );
      const token = synthToken ? synthToken.token : distributor.payoutToken;
      const displaySymbol = tokenOverrides[token.address] ?? token.symbol;
      if (map.has(displaySymbol)) {
        map.set(displaySymbol, map.get(displaySymbol).add(claimableAmount));
      } else {
        map.set(displaySymbol, claimableAmount);
      }
    });
    return map
      .entries()
      .toArray()
      .map(([displaySymbol, claimableAmount]) => ({
        displaySymbol,
        claimableAmount,
      }))
      .filter(({ claimableAmount }) => claimableAmount.gt(0))
      .sort((a, b) => a.displaySymbol.localeCompare(b.displaySymbol))
      .sort((a, b) => b.claimableAmount.toNumber() - a.claimableAmount.toNumber());
  }, [rewards, synthTokens]);

  // This caching is necessary to keep initial values after success and not reset them to zeroes
  const [cachedRewards, setCachedRewards] = React.useState<
    { displaySymbol: string; claimableAmount: Wei }[] | undefined
  >();
  React.useEffect(() => {
    if (groupedRewards && !cachedRewards) {
      setCachedRewards(groupedRewards);
    }
  }, [groupedRewards, cachedRewards]);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <ModalOverlay bg="#06061B80" />
      <ModalContent
        bg="navy.700"
        mt="10%"
        borderWidth="1px"
        borderColor="gray.900"
        minWidth="384px"
      >
        <ModalBody data-cy="claim rewards dialog" p={6}>
          <Text color="gray.50" fontSize="20px" fontWeight={700}>
            Claiming Rewards
          </Text>

          <Divider my={4} />

          <Flex
            position="relative"
            alignItems="center"
            gap={4}
            mb={6}
            rounded="lg"
            mt="6"
            p="4"
            border="2px solid"
            transitionProperty="border-color"
            transitionDuration="normal"
            borderColor={txnStatus === 'success' ? 'green.500' : 'gray.900'}
          >
            <Flex
              justifyContent="center"
              alignItems="center"
              borderRadius="100px"
              bg={txnStatus === 'success' ? 'green.600' : 'gray.900'}
              width="40px"
              height="40px"
              p={3}
            >
              {txnStatus === 'success' ? (
                <CheckIcon color="white" />
              ) : (
                <CircularProgress size="25px" isIndeterminate color="gray.700" />
              )}
            </Flex>
            <Flex
              flexDirection="column"
              alignItems="space-between"
              justifyContent="space-between"
              ml={2}
              data-cy="claim rewards info"
            >
              {cachedRewards
                ? cachedRewards.map(({ displaySymbol, claimableAmount }) => (
                    <Text
                      key={displaySymbol}
                      fontSize="14px"
                      fontWeight={700}
                      lineHeight="20px"
                      color="white"
                    >
                      <Amount
                        value={claimableAmount}
                        prefix="Claiming "
                        suffix={` ${displaySymbol}`}
                      />
                    </Text>
                  ))
                : null}
              <Text fontSize="12px" lineHeight="16px" color="gray.500">
                Claim your rewards
              </Text>
            </Flex>
          </Flex>
          <WithdrawIncrease />
          {txnStatus === 'success' && (
            <Button
              mt={5}
              variant="solid"
              justifyContent="center"
              px={3}
              py={3}
              width="100%"
              textAlign="center"
            >
              Done
            </Button>
          )}
          {txnHash && (
            <Flex
              justifyContent="center"
              px={3}
              py={3}
              mt={6}
              mb={1}
              borderTop="1px solid"
              borderTopColor="gray.900"
              data-cy="transaction hash"
            >
              <Link
                variant="outline"
                href={etherscanLink({ chain: network?.name || '', address: txnHash, isTx: true })}
                fontFamily="heading"
                color="cyan.500"
                fontWeight={700}
                lineHeight="20px"
                fontSize="14px"
                target="_blank"
                mt={3}
              >
                View Transaction
              </Link>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
