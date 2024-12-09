import {
  Button,
  Fade,
  Flex,
  Heading,
  Link,
  Table,
  TableContainer,
  Tbody,
  Tr,
} from '@chakra-ui/react';
import { NetworkIcon, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { type LiquidityPositionType } from '@snx-v3/useLiquidityPosition';
import { makeSearch, useParams } from '@snx-v3/useParams';
import { PositionsEmpty } from './PositionEmpty';
import { PositionsNotConnected } from './PositionNotConnected';
import { PositionRow } from './PositionsRow';
import { PositionsRowLoading } from './PositionsRowLoading';
import { PositionTableHeader } from './PositionTableHeader';
import { TableDivider } from './TableDivider';

const poolId = '1';

export function PositionsTable({
  isLoading,
  liquidityPositions,
  apr,
}: {
  isLoading: boolean;
  liquidityPositions: LiquidityPositionType[];
  apr?: any[];
}) {
  const [params, setParams] = useParams();
  const { activeWallet } = useWallet();
  const { network } = useNetwork();

  return (
    <TableContainer
      maxW="100%"
      mt={4}
      borderColor="gray.900"
      borderWidth="1px"
      borderRadius="5px"
      p={6}
      sx={{
        borderCollapse: 'separate !important',
        borderSpacing: 0,
      }}
      bg="navy.700"
    >
      {!activeWallet?.address ? (
        <PositionsNotConnected />
      ) : liquidityPositions.length === 0 && !isLoading ? (
        <PositionsEmpty />
      ) : (
        <>
          <Flex alignItems="center" justifyContent="space-between">
            <Heading
              as={Link}
              href={`?${makeSearch(
                network?.id
                  ? {
                      page: 'pool',
                      networkId: `${network.id}`,
                      poolId: '1',
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
                        poolId: '1',
                        accountId: params.accountId,
                      }
                    : { page: 'pools', accountId: params.accountId }
                );
              }}
              fontSize="18px"
              fontWeight={700}
              lineHeight="28px"
              color="gray.50"
              textDecoration="none"
              _hover={{ textDecoration: 'none', color: 'gray.50' }}
            >
              Spartan Council Pool
              {network && (
                <Flex alignItems="center" fontSize="12px" color="gray.500" gap={1}>
                  <Flex
                    alignItems="center"
                    fontSize="12px"
                    fontWeight="500"
                    color="gray.500"
                    gap={1}
                  >
                    <NetworkIcon size="14px" networkId={network.id} mr={1} />
                    {network.label} Network
                  </Flex>
                </Flex>
              )}
            </Heading>
            <Fade in>
              <Button
                as={Link}
                href={`?${makeSearch(
                  network?.id
                    ? {
                        page: 'pool',
                        networkId: `${network.id}`,
                        poolId: '1',
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
                          poolId: '1',
                          accountId: params.accountId,
                        }
                      : { page: 'pools', accountId: params.accountId }
                  );
                }}
                mt={{ base: 2, md: 0 }}
                size="sm"
                variant="outline"
                colorScheme="gray"
                color="white"
                textDecoration="none"
                _hover={{ textDecoration: 'none', color: 'white' }}
              >
                Details
              </Button>
            </Fade>
          </Flex>
          <Table variant="simple">
            <PositionTableHeader />
            <Tbody>
              <TableDivider />
              {isLoading ? (
                <PositionsRowLoading />
              ) : (
                <>
                  {liquidityPositions?.map((liquidityPosition, i) => {
                    const positionApr = apr?.find(
                      (apr) =>
                        apr.collateralType.toLowerCase() ===
                        liquidityPosition.collateralType.tokenAddress.toLowerCase()
                    );

                    return (
                      <Tr
                        key={`${poolId}-${liquidityPosition.collateralType.tokenAddress}`}
                        borderBottomWidth={i === liquidityPositions.length - 1 ? 'none' : '1px'}
                      >
                        <PositionRow
                          liquidityPosition={liquidityPosition}
                          apr={positionApr?.apr7d * 100}
                        />
                      </Tr>
                    );
                  })}
                </>
              )}
            </Tbody>
          </Table>
        </>
      )}
    </TableContainer>
  );
}
