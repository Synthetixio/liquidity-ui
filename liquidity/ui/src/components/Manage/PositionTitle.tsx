import { Flex, Heading, Link, Text } from '@chakra-ui/react';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { makeSearch, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export function PositionTitle() {
  const { network } = useNetwork();

  const [params, setParams] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

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
          symbol={collateralType?.symbol ?? params.collateralSymbol}
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
          {collateralType?.displaySymbol ?? params.collateralSymbol} Liquidity Position
        </Heading>
        <Heading
          as={Link}
          href={`?${makeSearch(
            network?.id
              ? {
                  page: 'pool',
                  networkId: `${network.id}`,
                  accountId: params.accountId,
                }
              : { page: 'pools', accountId: params.accountId }
          )}`}
          onClick={(e) => {
            e.preventDefault();
            setParams(
              network?.id
                ? {
                    page: 'pool',
                    networkId: `${network.id}`,
                    accountId: params.accountId,
                  }
                : { page: 'pools', accountId: params.accountId }
            );
          }}
          ml={4}
          fontWeight={700}
          fontSize={['12px', '16px']}
          color="gray.50"
          display="flex"
          alignItems="center"
          textDecoration="none"
          _hover={{ textDecoration: 'none' }}
        >
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
