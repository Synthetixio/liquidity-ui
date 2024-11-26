import { Flex, Heading, Skeleton, Tag, Text } from '@chakra-ui/react';
import { ARBITRUM, MAINNET, NetworkIcon, NETWORKS } from '@snx-v3/useBlockchain';
import { useParams } from '@snx-v3/useParams';
import { usePool } from '@snx-v3/usePoolsList';

export function PoolHeader() {
  const { poolId, networkId } = useParams();
  const { data: pool, isPending } = usePool(Number(networkId), String(poolId));
  const network = NETWORKS.find((n) => n.id === Number(networkId));

  const poolName = pool?.poolInfo?.[0]?.pool?.name ?? '';
  const networkName = network?.name ?? '';

  return (
    <>
      <Flex mt={3} flexWrap="wrap" gap={4} alignItems="center">
        <Skeleton isLoaded={!isPending}>
          <Heading fontWeight={700} fontSize="3xl">
            {poolName ? poolName : 'Unknown Pool'}
          </Heading>
        </Skeleton>
        {Number(networkId) === MAINNET.id || Number(networkId) === ARBITRUM.id ? (
          <Tag size="sm" bg="purple.500" mr="auto" color="white" height="fit-content">
            Borrow Interest-Free
          </Tag>
        ) : null}
      </Flex>
      <Flex mt={2}>
        <NetworkIcon w="14px" h="14px" networkId={network?.id} />
        <Text ml={1} fontSize="xs" color="gray.500" fontFamily="heading" lineHeight="16px">
          {`${networkName.slice(0, 1).toUpperCase()}${networkName.slice(1)} Network`}
        </Text>
      </Flex>
    </>
  );
}
