import { Button, Fade, Flex, Link, Text } from '@chakra-ui/react';
import { ZEROWEI } from '@snx-v3/constants';
import { formatNumber, formatNumberToUsd } from '@snx-v3/formatters';
import { Sparkles } from '@snx-v3/icons';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { Tooltip } from '@snx-v3/Tooltip';
import { useApr } from '@snx-v3/useApr';
import { useStataUSDCApr } from '@snx-v3/useApr/useStataUSDCApr';
import { Network, NetworkIcon, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { CollateralType } from '@snx-v3/useCollateralTypes';
import { useIsAndromedaStataUSDC } from '@snx-v3/useIsAndromedaStataUSDC';
import { makeSearch, useParams } from '@snx-v3/useParams';
import { useStaticAaveUSDCRate } from '@snx-v3/useStaticAaveUSDCRate';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useUSDC } from '@snx-v3/useUSDC';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import React from 'react';

interface CollateralTypeWithDeposited extends CollateralType {
  collateralDeposited: string;
}

export function PoolRow({
  pool: _pool,
  network,
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

  const isAndromedaStataUSDC = useIsAndromedaStataUSDC({
    tokenAddress: collateralType?.tokenAddress,
    customNetwork: network,
  });

  const balance = React.useMemo(() => {
    if (!isAndromedaStataUSDC || !stataUSDCRate) {
      return tokenBalance || ZEROWEI;
    }

    return ((usdcBalance || ZEROWEI).div(wei(stataUSDCRate, 27)) || ZEROWEI).add(
      tokenBalance || ZEROWEI
    );
  }, [isAndromedaStataUSDC, stataUSDCRate, tokenBalance, usdcBalance]);

  const price = wei(
    collateralPrices?.find(
      (price) => price.symbol.toUpperCase() === collateralType.symbol.toUpperCase()
    )?.price ?? 0
  );

  const { data: apr, isPending: isPendingApr } = useApr(network);
  const positionApr = React.useMemo(() => {
    if (apr && collateralType) {
      return apr.find(
        (item) => item.collateralType.toLowerCase() === collateralType.tokenAddress.toLowerCase()
      );
    }
  }, [apr, collateralType]);

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

  const order = React.useMemo(
    () =>
      wei(collateralType.collateralDeposited, Number(collateralType.decimals), true)
        .mul(price)
        .toNumber()
        .toFixed(0),
    [collateralType.collateralDeposited, collateralType.decimals, price]
  );

  return (
    <Fade in style={{ order }}>
      <Flex
        flexDir="row"
        w="100%"
        border="1px solid"
        borderColor="gray.900"
        rounded="base"
        bg="navy.700"
        py={4}
        px={4}
        gap={4}
        alignItems="center"
      >
        <Flex
          as={Link}
          href={`?${makeSearch({
            page: 'position',
            collateralSymbol: collateralType.symbol,
            manageAction: 'deposit',
            accountId: params.accountId,
          })}`}
          onClick={onClick}
          width="260px"
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
              lineHeight="28px"
              fontFamily="heading"
            >
              {collateralType.displaySymbol}
            </Text>
            <Text
              textTransform="capitalize"
              fontSize="xs"
              color="gray.500"
              fontFamily="heading"
              lineHeight="20px"
            >
              {network.name} Network
            </Text>
          </Flex>
        </Flex>

        <Flex width="240px" direction="column" alignItems="flex-end">
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

        <Flex width="240px" alignItems="center" justifyContent="flex-end">
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
                    .toNumber(),
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }
                )
              : 0}
          </Text>
        </Flex>

        <Flex width="164px" alignItems="center" justifyContent="flex-end">
          <Text
            fontFamily="heading"
            fontSize="14px"
            lineHeight="20px"
            fontWeight={500}
            color="white"
          >
            {isPendingApr ? (
              '~'
            ) : positionApr ? (
              <>
                {(
                  positionApr.apr28dPerformance * 100 +
                  (isAndromedaStataUSDC && stataUSDCApr ? stataUSDCApr : 0) +
                  positionApr.apr24hIncentiveRewards * 100
                )
                  .toFixed(2)
                  .concat('%')}

                <Tooltip
                  label={
                    <Flex direction="column">
                      <Flex justifyContent="space-between">
                        <Text mr={2}>Performance:</Text>
                        <Text>{(positionApr.apr28dPerformance * 100).toFixed(2).concat('%')}</Text>
                      </Flex>
                      {positionApr.apr24hIncentiveRewards > 0 && (
                        <Flex justifyContent="space-between">
                          <Text mr={2}>Rewards: </Text>
                          <Text>
                            {(positionApr.apr24hIncentiveRewards * 100).toFixed(2).concat('%')}
                          </Text>
                        </Flex>
                      )}
                      {isAndromedaStataUSDC && stataUSDCApr ? (
                        <Flex justifyContent="space-between">
                          <Text mr={2}>AAVE yield: </Text>
                          <Text>{stataUSDCApr.toFixed(2).concat('%')}</Text>
                        </Flex>
                      ) : null}
                    </Flex>
                  }
                >
                  <Flex as="span" display="inline">
                    <Sparkles w="14px" h="14px" mb={1} ml="0.5px" mt="1px" />
                  </Flex>
                </Tooltip>
              </>
            ) : (
              '-'
            )}
          </Text>
        </Flex>
        <Flex minW="120px" flex="1" justifyContent="flex-end">
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
    </Fade>
  );
}
