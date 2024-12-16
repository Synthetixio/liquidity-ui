import { Button, Fade, Flex, Link, Text } from '@chakra-ui/react';
import { ZEROWEI } from '@snx-v3/constants';
import { formatNumber, formatNumberToUsd, formatApr } from '@snx-v3/formatters';
import { Sparkles } from '@snx-v3/icons';
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
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import { makeSearch, useParams } from '@snx-v3/useParams';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useUSDC } from '@snx-v3/useUSDC';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import React from 'react';
import { MigrationBanner } from '../../Migration/MigrationBanner';
import { TokenIcon } from '../../TokenIcon/TokenIcon';
import { Specifics } from './Specifics';

interface CollateralTypeWithDeposited extends CollateralType {
  collateralDeposited: string;
}

export function PoolRow({
  pool: _pool,
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
    price: ethers.BigNumber;
  }[];
  apr: {
    combinedApr: number;
    cumulativePnl: number;
    collateralAprs: any[];
  };
}) {
  const [params, setParams] = useParams();

  const { data: synthTokens } = useSynthTokens();
  const wrapperToken = React.useMemo(() => {
    if (synthTokens && collateralType) {
      return synthTokens.find((synth) => synth.address === collateralType.tokenAddress)?.token
        ?.address;
    }
  }, [collateralType, synthTokens]);

  const { data: stataUSDCApr } = useStataUSDCApr(network.id, network.preset);

  // TODO: This will need refactoring
  const balanceAddress =
    network?.preset === 'andromeda' ? wrapperToken : collateralType?.tokenAddress;

  const { data: stataUSDCRate } = useStaticAaveUSDCRate();
  const { data: tokenBalance } = useTokenBalance(balanceAddress, network);

  const { data: USDCToken } = useUSDC(network);
  const { data: usdcBalance } = useTokenBalance(USDCToken?.address, network);

  const { network: currentNetwork, setNetwork } = useNetwork();
  const { connect } = useWallet();

  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  const balance = React.useMemo(() => {
    if (!isStataUSDC || !stataUSDCRate) {
      return tokenBalance || ZEROWEI;
    }

    return ((usdcBalance || ZEROWEI).div(wei(stataUSDCRate, 27)) || ZEROWEI).add(
      tokenBalance || ZEROWEI
    );
  }, [isStataUSDC, stataUSDCRate, tokenBalance, usdcBalance]);

  const price = wei(
    collateralPrices?.find(
      (price) => price.symbol.toUpperCase() === collateralType.symbol.toUpperCase()
    )?.price ?? 0
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
            <Text color="gray.500" fontFamily="heading" fontSize="12px" lineHeight="16px">
              {balance ? formatNumber(balance.toNumber()) : ''} {collateralType.displaySymbol}
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
                ? formatApr(apr7d * 100 + stataUSDCApr)
                : formatApr(apr7d * 100)}
              <Tooltip
                label={
                  <Flex direction="column">
                    <Flex justifyContent="space-between">
                      <Text fontWeight={700} mr={2}>
                        Total APR:
                      </Text>
                      <Text fontWeight={700}>{formatApr(apr7d * 100)}</Text>
                    </Flex>
                    <Flex justifyContent="space-between">
                      <Text mr={2}>Performance:</Text>
                      <Text>{formatApr(apr7dPnl * 100)}</Text>
                    </Flex>
                    <Flex justifyContent="space-between">
                      <Text mr={2}>Rewards: </Text>
                      <Text>{formatApr(apr7dRewards * 100)}</Text>
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
