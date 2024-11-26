import { Flex, Heading, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useNavigate } from 'react-router-dom';
import { TokenIcon } from '../TokenIcon';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { usePool } from '@snx-v3/usePoolsList';
import { useParams } from '@snx-v3/useParams';

export const PositionTitle: FC<{
  collateralSymbol?: string;
  isOpen: boolean;
}> = ({ collateralSymbol, isOpen }) => {
  const { poolId, networkId } = useParams();
  const { data: pool } = usePool(Number(networkId), String(poolId));
  const { data: collateral } = useCollateralType(collateralSymbol);
  const { network } = useNetwork();
  const navigate = useNavigate();
  const poolName = pool?.poolInfo?.[0]?.pool?.name ?? '';
  return (
    <Flex alignItems="center">
      <Flex
        bg="linear-gradient(180deg, #08021E 0%, #1F0777 100%)"
        justifyContent="center"
        alignItems="center"
        borderRadius="100%"
        display="flex"
      >
        <TokenIcon
          symbol={collateral?.symbol || ''}
          height={42}
          width={42}
          fill="#0B0B22"
          color="#00D1FF"
        />
      </Flex>
      <Flex direction="column" gap={0.5}>
        <Heading
          ml={4}
          fontWeight={700}
          fontSize={['18px', '20px', '24px']}
          color="gray.50"
          display="flex"
          alignItems="center"
        >
          {isOpen ? 'Open ' : ''} {collateral?.displaySymbol} Liquidity Position
        </Heading>
        <Heading
          ml={4}
          fontWeight={700}
          fontSize={['12px', '16px']}
          color="gray.50"
          display="flex"
          alignItems="center"
          _hover={{ cursor: 'pointer' }}
          onClick={
            poolId && networkId ? () => navigate(`/pools/${network?.id}/${poolId}`) : undefined
          }
        >
          <Text mr={2}>{poolName}</Text>
          <Flex
            mt={0.25}
            alignItems="center"
            fontSize={['10px', '12px']}
            color="gray.500"
            fontWeight="500"
          >
            <NetworkIcon size="14px" networkId={network?.id} mr={1} />
            <Text mt={0.5}>{network?.label} Network</Text>
          </Flex>
        </Heading>
      </Flex>
    </Flex>
  );
};
