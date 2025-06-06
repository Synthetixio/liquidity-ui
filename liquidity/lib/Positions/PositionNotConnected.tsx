import { Button, Flex, Text } from '@chakra-ui/react';
import { useWallet } from '@snx-v3/useBlockchain';

export const PositionsNotConnected = () => {
  const { connect } = useWallet();
  return (
    <Flex w="100%" justifyContent="space-between" alignItems="center">
      <Text color="gray.500" fontWeight={500} fontSize="14px" lineHeight="14px" my="4" pl="3">
        Please connect wallet to view active positions
      </Text>
      <Button
        size="sm"
        data-cy="connect wallet button"
        minWidth="fit-content"
        ml="4"
        onClick={() => {
          connect();
        }}
      >
        Connect Wallet
      </Button>
    </Flex>
  );
};
