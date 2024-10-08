import { Flex, Heading, Text } from '@chakra-ui/react';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCombinedTokenBalance } from '@snx-v3/useCombinedTokenBalance';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { usePoolData } from '@snx-v3/usePoolData';
import { useNavigate } from 'react-router-dom';
import { TokenIcon } from '../TokenIcon';

export function PositionTitle() {
  const params = useParams();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: poolData } = usePoolData(params.poolId);

  const { data: combinedTokenBalance } = useCombinedTokenBalance(collateralType);

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    tokenAddress: collateralType?.tokenAddress,
    accountId: params.accountId,
    poolId: params.poolId,
  });

  const hasPosition = liquidityPosition && liquidityPosition.collateralAmount.gt(0);
  const hasAvailableCollateral =
    liquidityPosition && liquidityPosition.accountCollateral.availableCollateral.gt(0);
  const isNewPosition =
    !params.accountId ||
    (params.accountId && !isPendingLiquidityPosition && !hasPosition && !hasAvailableCollateral);

  const { network } = useNetwork();
  const navigate = useNavigate();

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
          symbol={combinedTokenBalance?.main.symbol}
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
          {isNewPosition ? (
            <>Open {combinedTokenBalance?.main.displayName} Liquidity Position</>
          ) : (
            <>{combinedTokenBalance?.main.displayName} Liquidity Position</>
          )}
        </Heading>
        <Heading
          ml={4}
          fontWeight={700}
          fontSize={['12px', '16px']}
          color="gray.50"
          display="flex"
          alignItems="center"
          _hover={{ cursor: 'pointer' }}
          onClick={() => navigate(`/pools/${network?.id}/${params.poolId}`)}
        >
          {poolData?.name && <Text mr={2}>{poolData?.name}</Text>}
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
}
