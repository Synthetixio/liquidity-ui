import {
  Button,
  Fade,
  Flex,
  Skeleton,
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
import { calculateCRatio } from '@snx-v3/calculations';
import { formatNumber, formatNumberToUsd, formatPercent } from '@snx-v3/formatters';
import { Sparkles } from '@snx-v3/icons';
import { Tooltip } from '@snx-v3/Tooltip';
import { useApr } from '@snx-v3/useApr';
import { ARBITRUM, NETWORKS, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { type PoolPageSchemaType, useParams } from '@snx-v3/useParams';
import { useVaultsData, VaultsDataType } from '@snx-v3/useVaultsData';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export const calculateVaultTotals = (vaultsData: VaultsDataType) => {
  const zeroValues = { collateral: { value: wei(0), amount: wei(0) }, debt: wei(0) };
  if (!vaultsData) return zeroValues;

  return vaultsData.reduce((acc, { collateral, debt }) => {
    acc.collateral = {
      value: acc.collateral.value.add(collateral.value),
      amount: acc.collateral.amount.add(collateral.amount),
    };
    acc.debt = acc.debt.add(debt);
    return acc;
  }, zeroValues);
};

export function formatApr(apr?: number, networkId?: number) {
  if (!networkId || !apr) return '-';

  return `${apr.toFixed(2)}%`;
}

export const CollateralSection = () => {
  const [params, setParams] = useParams<PoolPageSchemaType>();
  const network = NETWORKS.find((n) => n.id === Number(params.networkId));
  const { data: vaultsData, isPending: isVaultsLoading } = useVaultsData(network);
  const { data: aprData, isPending: isAprLoading } = useApr(network);
  const { network: currentNetwork, setNetwork } = useNetwork();
  const { connect } = useWallet();
  const { collateral: totalCollateral, debt: totalDebt } = calculateVaultTotals(vaultsData);
  const isInTotalProfit = totalDebt.lt(0);

  return (
    <Flex
      bg="navy.700"
      borderWidth="1px"
      borderColor="gray.900"
      borderRadius="base"
      padding={6}
      flexDirection="column"
      data-cy="pool collateral types"
    >
      <Text fontWeight={700} fontSize="xl">
        Pool Collateralization
      </Text>
      <BorderBox padding={4} mt={4} flexDirection="column">
        {/* Total TVL */}
        <Flex justifyContent="space-between" mb={2}>
          <Text
            display="flex"
            alignItems="center"
            fontWeight={700}
            fontSize="md"
            gap={1}
            color="white"
          >
            Total TVL
          </Text>
          <Skeleton
            startColor="whiteAlpha.500"
            endColor="whiteAlpha.200"
            borderRadius={4}
            isLoaded={Boolean(!isVaultsLoading && vaultsData)}
            placeholder="$147,654,901.78"
            width="163px"
            height="26px"
          >
            <Fade in>
              <Text fontWeight={700} fontSize="xl" color="white" data-cy="pool tvl" textAlign="end">
                {formatNumberToUsd(totalCollateral.value.toNumber(), { maximumFractionDigits: 0 })}
              </Text>
            </Fade>
          </Skeleton>
        </Flex>
        {/* Total Debt */}
        <Flex justifyContent="space-between" mb={2}>
          <Text
            display="flex"
            alignItems="center"
            fontWeight={700}
            fontSize="md"
            gap={1}
            color="white"
          >
            Total Debt/Profit
          </Text>
          <Skeleton
            startColor="whiteAlpha.500"
            endColor="whiteAlpha.200"
            borderRadius={4}
            isLoaded={Boolean(!isVaultsLoading && vaultsData)}
            placeholder="$147,654,901.78"
            width="163px"
            height="26px"
          >
            <Fade in>
              <Text
                fontWeight={700}
                fontSize="xl"
                data-cy="pool total debt"
                textAlign="end"
                color={isInTotalProfit ? 'green.500' : 'white'}
              >
                {isInTotalProfit ? '+' : '-'}
                {formatNumberToUsd(totalDebt.abs().toNumber(), { maximumFractionDigits: 0 })}
              </Text>
            </Fade>
          </Skeleton>
        </Flex>
        {/* APR */}
        <Flex justifyContent="space-between">
          <Text
            display="flex"
            alignItems="center"
            fontWeight={700}
            fontSize="md"
            gap={1}
            color="white"
          >
            APR
          </Text>
          <Skeleton
            startColor="whiteAlpha.500"
            endColor="whiteAlpha.200"
            borderRadius={4}
            isLoaded={!isAprLoading}
            width="163px"
            height="26px"
          >
            <Fade in>
              <Tooltip label="APR is averaged over the trailing 7 days and is comprised of both performance and rewards">
                <Text fontWeight={700} fontSize="xl" color="white" textAlign="end">
                  {network?.id === ARBITRUM.id ? 'Up to ' : ''}
                  {formatApr(aprData?.combinedApr, network?.id)}
                </Text>
              </Tooltip>
            </Fade>
          </Skeleton>
        </Flex>
      </BorderBox>
      <TableContainer
        maxW="100%"
        mt={4}
        borderRadius="5px"
        sx={{
          borderCollapse: 'separate !important',
          borderSpacing: 0,
        }}
      >
        <Table>
          <Thead>
            <Tr>
              <Th
                borderBottom="none"
                fontFamily="heading"
                fontSize="12px"
                fontWeight={700}
                lineHeight="16px"
                letterSpacing={0.6}
                color="gray.600"
                textTransform="none"
              >
                Asset
              </Th>
              <Th
                borderBottom="none"
                fontFamily="heading"
                fontSize="12px"
                fontWeight={700}
                lineHeight="16px"
                letterSpacing={0.6}
                color="gray.600"
                textTransform="none"
              >
                TVL
              </Th>
              <Th
                borderBottom="none"
                fontFamily="heading"
                fontSize="12px"
                fontWeight={700}
                lineHeight="16px"
                letterSpacing={0.6}
                color="gray.600"
                textTransform="none"
              >
                Debt/Profit
              </Th>
              <Th
                borderBottom="none"
                fontFamily="heading"
                fontSize="12px"
                fontWeight={700}
                lineHeight="16px"
                letterSpacing={0.6}
                color="gray.600"
                textTransform="none"
              >
                APR
              </Th>
              <Th
                borderBottom="none"
                fontFamily="heading"
                fontSize="12px"
                fontWeight={700}
                lineHeight="16px"
                letterSpacing={0.6}
                color="gray.600"
                textTransform="none"
              >
                {' '}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {(isAprLoading || isVaultsLoading || !vaultsData) && (
              <React.Fragment>
                {[1, 2, 3].map((index) => (
                  <Tr
                    key={index}
                    textAlign="left"
                    borderBottomColor="gray.900"
                    borderBottomWidth="1px"
                  >
                    <Th borderBottom="none">
                      <Skeleton
                        startColor="whiteAlpha.500"
                        endColor="whiteAlpha.200"
                        borderRadius={4}
                        height="26px"
                        width="92px"
                      />
                    </Th>
                    <Th borderBottom="none">
                      <Skeleton
                        startColor="whiteAlpha.500"
                        endColor="whiteAlpha.200"
                        borderRadius={4}
                        height="26px"
                        width="92px"
                      />
                    </Th>
                    <Th borderBottom="none">
                      <Skeleton
                        startColor="whiteAlpha.500"
                        endColor="whiteAlpha.200"
                        borderRadius={4}
                        height="26px"
                        width="92px"
                      />
                    </Th>
                    <Th borderBottom="none">
                      <Skeleton
                        startColor="whiteAlpha.500"
                        endColor="whiteAlpha.200"
                        borderRadius={4}
                        height="26px"
                        width="92px"
                      />
                    </Th>
                    <Th borderBottom="none">
                      <Skeleton
                        startColor="whiteAlpha.500"
                        endColor="whiteAlpha.200"
                        borderRadius={4}
                        height="26px"
                        width="92px"
                      />
                    </Th>
                  </Tr>
                ))}
              </React.Fragment>
            )}
            {vaultsData?.map((vaultCollateral, i) => {
              // Calculate c-ratio
              const cRatio = calculateCRatio(
                vaultCollateral.debt,
                vaultCollateral.collateral.value
              );

              const collateralApr = aprData?.collateralAprs.find(
                (collateralAprData: { collateralType: string }) =>
                  collateralAprData.collateralType.toLowerCase() ===
                  vaultCollateral.collateralType.tokenAddress.toLowerCase()
              );

              const { apr28d, apr28dRewards, apr28dPnl } = collateralApr || {
                apr28d: 0,
                apr28dRewards: 0,
                apr28dPnl: 0,
              };

              const isInProfit = vaultCollateral.debt.lt(0);

              const borderTopWidth = i === 0 ? '1px' : '0px';

              return (
                <Tr
                  key={vaultCollateral.collateralType.tokenAddress}
                  borderTopWidth={borderTopWidth}
                  borderTopColor="gray.900"
                  borderBottomWidth="1px"
                  borderBottomColor="gray.900"
                >
                  <Td borderBottom="none" py={1}>
                    <Fade in>
                      <Flex alignItems="center" gap={2}>
                        <TokenIcon symbol={vaultCollateral.collateralType.symbol} w={30} h={30} />
                        <Flex>
                          <Flex direction="column">
                            <Text fontWeight={700} lineHeight="20px" fontSize="14px" color="white">
                              {vaultCollateral.collateralType.displaySymbol}
                            </Text>
                            <Text
                              fontFamily="heading"
                              fontSize="12px"
                              lineHeight="16px"
                              color="gray.500"
                            >
                              {vaultCollateral.collateralType.name}
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                    </Fade>
                  </Td>
                  <Td borderBottom="none">
                    <Fade in>
                      <Flex direction="column">
                        <Text
                          fontSize="14px"
                          fontWeight={500}
                          color="white"
                          lineHeight="20px"
                          fontFamily="heading"
                          data-cy="collateral value"
                        >
                          {formatNumberToUsd(vaultCollateral.collateral.value.toNumber(), {
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          })}
                        </Text>
                        <Text
                          fontSize="12px"
                          color="gray.500"
                          lineHeight="16px"
                          fontFamily="heading"
                          data-cy="collateral value"
                        >
                          {formatNumber(vaultCollateral.collateral.amount.toNumber(), {
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          })}{' '}
                          {vaultCollateral.collateralType.symbol}
                        </Text>
                      </Flex>
                    </Fade>
                  </Td>
                  <Td borderBottom="none">
                    <Fade in>
                      <Tooltip
                        label={
                          isInProfit
                            ? `This vault has a profit of ${formatNumberToUsd(
                                vaultCollateral.debt.abs().toNumber(),
                                {
                                  maximumFractionDigits: 0,
                                  minimumFractionDigits: 0,
                                }
                              )}`
                            : ''
                        }
                      >
                        <Flex direction="column">
                          <Text
                            fontSize="14px"
                            color={isInProfit ? 'green.500' : 'white'}
                            data-cy="collateral debt"
                            fontWeight={500}
                          >
                            {isInProfit ? '+' : '-'}
                            {formatNumberToUsd(vaultCollateral.debt.abs().toNumber(), {
                              maximumFractionDigits: 0,
                              minimumFractionDigits: 0,
                            })}
                          </Text>
                          <Text
                            fontFamily="heading"
                            fontSize="12px"
                            lineHeight="14px"
                            color="gray.500"
                          >
                            C-ratio: {cRatio.lte(0) ? 'Infinite' : formatPercent(cRatio.toNumber())}
                          </Text>
                        </Flex>
                      </Tooltip>
                    </Fade>
                  </Td>
                  <Td borderBottom="none">
                    <Fade in>
                      <Tooltip
                        label={
                          <Flex direction="column">
                            <Flex justifyContent="space-between">
                              <Text fontWeight={700} mr={2}>
                                Total APR:
                              </Text>
                              <Text fontWeight={700}>{formatApr(apr28d * 100, network?.id)}</Text>
                            </Flex>
                            <Flex justifyContent="space-between">
                              <Text mr={2}>Performance:</Text>
                              <Text>{formatApr(apr28dPnl * 100, network?.id)}</Text>
                            </Flex>
                            <Flex justifyContent="space-between">
                              <Text mr={2}>Rewards: </Text>
                              <Text>{formatApr(apr28dRewards * 100, network?.id)}</Text>
                            </Flex>
                          </Flex>
                        }
                      >
                        <Flex alignItems="center">
                          <Text
                            fontSize="sm"
                            fontWeight={500}
                            color="white"
                            data-cy="collateral apr"
                          >
                            {formatApr(apr28d * 100, network?.id)}
                          </Text>
                          <Sparkles w="14px" h="14px" mb={1} ml="0.5px" mt="1px" />
                        </Flex>
                      </Tooltip>
                    </Fade>
                  </Td>
                  <Td borderBottom="none" textAlign="end">
                    <Fade in>
                      <Button
                        onClick={async (e) => {
                          try {
                            e.stopPropagation();

                            if (!currentNetwork) {
                              connect();
                              return;
                            }

                            if (network && currentNetwork.id !== network.id) {
                              if (!(await setNetwork(network.id))) {
                                return;
                              }
                            }

                            setParams({
                              page: 'position',
                              collateralSymbol: vaultCollateral.collateralType.symbol,
                              manageAction: 'deposit',
                              accountId: params.accountId,
                            });
                          } catch (error) {
                            console.error(error);
                          }
                        }}
                        height="32px"
                        py="10px"
                        px="12px"
                        whiteSpace="nowrap"
                        borderRadius="4px"
                        fontFamily="heading"
                        fontWeight={700}
                        fontSize="14px"
                        lineHeight="20px"
                      >
                        Deposit
                      </Button>
                    </Fade>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Flex>
  );
};
