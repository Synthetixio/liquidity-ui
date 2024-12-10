import { Button, Fade, Flex, Link, Text } from '@chakra-ui/react';
import { ZEROWEI } from '@snx-v3/constants';
import { formatNumber, formatNumberToUsd } from '@snx-v3/formatters';
import { Sparkles } from '@snx-v3/icons';
import { getSpotMarketId, isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { Tooltip } from '@snx-v3/Tooltip';
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';
import {
  MAINNET,
  Network,
  NetworkIcon,
  SEPOLIA,
  useNetwork,
  useWallet,
} from '@snx-v3/useBlockchain';
import { CollateralType } from '@snx-v3/useCollateralTypes';
import { useGetWrapperToken } from '@snx-v3/useGetUSDTokens';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { makeSearch, useParams } from '@snx-v3/useParams';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useUSDC } from '@snx-v3/useUSDC';
import { wei } from '@synthetixio/wei';
import { BigNumberish } from 'ethers';
import React from 'react';
import { MigrationBanner } from '../../Migration/MigrationBanner';
import { TokenIcon } from '../../TokenIcon/TokenIcon';
import { formatApr } from '../CollateralSection';
import { Specifics } from './Specifics';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { Amount } from '@snx-v3/Amount';
import { InfoIcon } from '@chakra-ui/icons';

interface CollateralTypeWithDeposited extends CollateralType {
  collateralDeposited: string;
}

export function PoolRow({
  pool,
  network,
  apr,
  collateralType,
  collateralPrices,
}: {
  collateralType: CollateralTypeWithDeposited;
  pool: {
    name: string;
    id: string;
  };
  network: Network;
  collateralPrices?: {
    symbol: string;
    price: BigNumberish;
  }[];
  apr: {
    combinedApr: number;
    cumulativePnl: number;
    collateralAprs: any[];
  };
}) {
  const [params, setParams] = useParams();
  const { data: stataUSDC } = useStaticAaveUSDC();
  const { data: USDCToken } = useUSDC(network);
  const { data: wrapperToken } = useGetWrapperToken(
    getSpotMarketId(collateralType.symbol),
    network
  );

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });
  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const { data: stataUSDCApr } = useStataUSDCApr(network.id, network.preset);

  const balanceAddress = isBase
    ? isStataUSDC
      ? stataUSDC?.address
      : wrapperToken
    : collateralType?.tokenAddress;

  const { data: stataUSDCRate } = useStaticAaveUSDCRate();
  const { data: tokenBalance } = useTokenBalance(balanceAddress, network);

  const { data: usdcBalance } = useTokenBalance(USDCToken?.address, network);

  const { network: currentNetwork, setNetwork } = useNetwork();
  const { connect } = useWallet();

  const stataUSDCBalance = React.useMemo(() => {
    if (!isStataUSDC || !stataUSDCRate) {
      return ZEROWEI;
    }

    return (usdcBalance?.div(stataUSDCRate) || ZEROWEI).mul(998).div(1000);
  }, [isStataUSDC, stataUSDCRate, usdcBalance]);

  const balance = React.useMemo(() => {
    if (!isStataUSDC || !stataUSDCRate) {
      return tokenBalance || ZEROWEI;
    }

    return stataUSDCBalance.add(tokenBalance || ZEROWEI);
  }, [isStataUSDC, stataUSDCBalance, stataUSDCRate, tokenBalance]);

  const price = wei(
    collateralPrices?.find(
      (price) => price.symbol.toUpperCase() === collateralType.symbol.toUpperCase()
    )?.price || ZEROWEI
  );

  const collateralApr = apr.collateralAprs.find(
    (apr) => apr.collateralType === collateralType.tokenAddress.toLowerCase()
  ) || { apr7d: 0, apr7dRewards: 0, apr7dPnl: 0 };

  const { apr7d, apr7dRewards, apr7dPnl } = collateralApr;

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (!currentNetwork) {
        await connect();
        return;
      }
      if (currentNetwork.id !== network.id) {
        if (!(await setNetwork(network.id))) {
          return;
        }
      }
      setParams({
        page: 'position',
        collateralSymbol: collateralType.symbol,
        poolId: pool.id,
        manageAction: 'deposit',
        accountId: params.accountId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const buttonText = !currentNetwork ? 'Connect Wallet' : 'Deposit';

  return (
    <Fade in>
      <Flex
        flexDir="column"
        w="100%"
        border="1px solid"
        borderColor="gray.900"
        rounded="base"
        bg="navy.700"
        px={3}
        py={4}
      >
        <Flex px={4} flexDir="row" w="100%" gap={4}>
          <Flex
            as={Link}
            href={`?${makeSearch({
              page: 'position',
              collateralSymbol: collateralType.symbol,
              poolId: pool.id,
              manageAction: 'deposit',
              accountId: params.accountId,
            })}`}
            onClick={onClick}
            width="190px"
            alignItems="center"
            textDecoration="none"
            _hover={{ textDecoration: 'none' }}
          >
            <Flex position="relative">
              <TokenIcon w={40} h={40} symbol={collateralType.symbol} />
              <NetworkIcon
                position="absolute"
                right={0}
                bottom={0}
                networkId={network.id}
                size="14px"
              />
            </Flex>
            <Flex flexDirection="column" ml={3} mr="auto">
              <Text
                fontSize="14px"
                color="white"
                fontWeight={700}
                lineHeight="1.25rem"
                fontFamily="heading"
              >
                {collateralType.displaySymbol}
              </Text>
              <Text
                textTransform="capitalize"
                fontSize="xs"
                color="gray.500"
                fontFamily="heading"
                lineHeight="1rem"
              >
                {network.name} Network
              </Text>
            </Flex>
          </Flex>
          <Flex width="220px" direction="column" alignItems="flex-end">
            <Text
              fontFamily="heading"
              fontSize="14px"
              fontWeight={500}
              lineHeight="28px"
              color="white"
            >
              {balance ? formatNumberToUsd(balance.mul(price).toNumber()) : '-'}
            </Text>
            <Text
              display="flex"
              alignItems="center"
              gap="1"
              color="gray.500"
              fontFamily="heading"
              fontSize="12px"
              lineHeight="16px"
            >
              {balance ? formatNumber(balance.toNumber()) : ''} {collateralType.displaySymbol}
              {isStataUSDC && (
                <Tooltip
                  label={
                    <Flex
                      flexDirection="column"
                      alignItems="flex-start"
                      fontSize="xs"
                      color="whiteAlpha.700"
                    >
                      <Flex gap="1">
                        <Text>Wallet Balance:</Text>
                        <Amount value={tokenBalance} />
                      </Flex>
                      <Flex gap="1">
                        <Text>USDC Balance:</Text>
                        <Amount value={usdcBalance} />
                        <Amount prefix="(~" value={stataUSDCBalance} suffix=" Static aUSDC)" />
                      </Flex>
                    </Flex>
                  }
                >
                  <InfoIcon />
                </Tooltip>
              )}
            </Text>
          </Flex>
          <Flex width="189px" flexDir="column" justifyContent="cetner" alignItems="flex-end">
            <Text
              fontFamily="heading"
              fontSize="14px"
              fontWeight={500}
              lineHeight="28px"
              color="white"
            >
              SC Pool
            </Text>
            <Text color="gray.500" fontFamily="heading" fontSize="12px" lineHeight="16px">
              Spartan Council
            </Text>
          </Flex>
          <Flex width="144px" alignItems="center" justifyContent="flex-end">
            <Text
              fontFamily="heading"
              fontSize="14px"
              lineHeight="20px"
              fontWeight={500}
              color="white"
              textAlign="right"
            >
              {price
                ? formatNumberToUsd(
                    wei(collateralType.collateralDeposited, Number(collateralType.decimals), true)
                      .mul(price)
                      .toNumber()
                  )
                : 0}
            </Text>
          </Flex>
          <Flex width="144px" alignItems="center" justifyContent="flex-end">
            <Text
              fontFamily="heading"
              fontSize="14px"
              lineHeight="20px"
              fontWeight={500}
              color="white"
            >
              {isStataUSDC && stataUSDCApr
                ? formatApr(apr7d * 100 + stataUSDCApr, network?.id)
                : formatApr(apr7d * 100, network?.id)}
              <Tooltip
                label={
                  <Flex direction="column">
                    <Flex justifyContent="space-between">
                      <Text fontWeight={700} mr={2}>
                        Total APR:
                      </Text>
                      <Text fontWeight={700}>{formatApr(apr7d * 100, network?.id)}</Text>
                    </Flex>
                    <Flex justifyContent="space-between">
                      <Text mr={2}>Performance:</Text>
                      <Text>{formatApr(apr7dPnl * 100, network?.id)}</Text>
                    </Flex>
                    <Flex justifyContent="space-between">
                      <Text mr={2}>Rewards: </Text>
                      <Text>{formatApr(apr7dRewards * 100, network?.id)}</Text>
                    </Flex>
                  </Flex>
                }
              >
                <Flex as="span" display="inline">
                  <Sparkles w="14px" h="14px" mb={1} ml="0.5px" mt="1px" />
                </Flex>
              </Tooltip>
            </Text>
          </Flex>
          <Flex alignItems="center" justifyContent="flex-end" width="121px" textAlign="right">
            <Specifics network={network} collateralType={collateralType} />
          </Flex>
          <Flex minW="159px" flex="1" justifyContent="flex-end">
            <Button
              as={Link}
              href={`?${makeSearch({
                page: 'position',
                collateralSymbol: collateralType.symbol,
                poolId: pool.id,
                manageAction: 'deposit',
                accountId: params.accountId,
              })}`}
              onClick={onClick}
              size="sm"
              height="32px"
              py="10px"
              px={2}
              whiteSpace="nowrap"
              borderRadius="4px"
              fontFamily="heading"
              fontWeight={700}
              fontSize="14px"
              lineHeight="20px"
              color="black"
              textDecoration="none"
              _hover={{ textDecoration: 'none', color: 'black' }}
            >
              {buttonText}
            </Button>
          </Flex>
        </Flex>

        {[MAINNET.id, SEPOLIA.id].includes(network.id) && (
          <MigrationBanner network={network} type="banner" />
        )}
      </Flex>
    </Fade>
  );
}
