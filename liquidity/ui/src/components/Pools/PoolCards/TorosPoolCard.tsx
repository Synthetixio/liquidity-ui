import { Flex, Text, Button, Link, Fade, Icon, IconProps } from '@chakra-ui/react';
import { ARBITRUM, BASE_ANDROMEDA, NetworkIcon } from '@snx-v3/useBlockchain';
import { TokenIcon } from '../../TokenIcon';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { formatNumberToUsd } from '@snx-v3/formatters';
import { formatNumber } from 'humanize-plus';
import { Specifics } from './Specifics';
import { useQuery } from '@tanstack/react-query';
import { fetchTorosPool } from '@snx-v3/usePoolsList';

interface TorosPoolCardProps {
  token: 'USDC' | 'wstETH';
}

const vaults = {
  USDC: {
    pool: '0xc1e02884af4a283ca25ab63c45360d220d69da52',
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    network: BASE_ANDROMEDA,
    link: 'https://toros.finance/synthetix-usdc-andromeda-yield',
  },
  wstETH: {
    pool: '0xe9b5260d99d283ff887859c569baf8ad1bd12aac',
    address: '0x5979d7b546e38e414f7e9822514be443a4800529',
    network: ARBITRUM,
    link: 'https://toros.finance/synthetix-eth-yield',
  },
};

export function TorosPoolCard({ token }: TorosPoolCardProps) {
  const vault = vaults[token];

  const { data: balance } = useTokenBalance(vault.address, vault.network);
  const { data } = useQuery({
    queryKey: ['toros-pool', token],
    queryFn: () => fetchTorosPool(vault.pool),
  });

  return (
    <Fade in>
      <Flex
        flexDir="row"
        w="100%"
        border="1px solid"
        borderColor="gray.900"
        rounded="base"
        bg="navy.700"
        gap={4}
        px={7}
        py={4}
      >
        <Flex width="190px" alignItems="center">
          <Flex position="relative">
            <TokenIcon w={40} h={40} symbol={token} />
            <NetworkIcon
              position="absolute"
              right={0}
              bottom={0}
              networkId={vault.network.id}
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
              {token}
            </Text>
            <Text
              textTransform="capitalize"
              fontSize="xs"
              color="gray.500"
              fontFamily="heading"
              lineHeight="1rem"
            >
              {vault.network.name} Network
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
            {balance ? formatNumberToUsd(balance.toNumber()) : '-'}
          </Text>
          <Text color="gray.500" fontFamily="heading" fontSize="12px" lineHeight="16px">
            {balance ? formatNumber(balance.toNumber()) : ''} {token}
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
            Toros Yield Vault
          </Text>
          <Text color="gray.500" fontFamily="heading" fontSize="12px" lineHeight="16px">
            Toros
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
            ${data?.tvl}
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
            {data?.apy}%
          </Text>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end" width="121px" textAlign="right">
          <Specifics isToros collateralType={{ address: vault.address, symbol: token }} />
        </Flex>
        <Flex flex={1} minWidth="159px" alignItems="center" justifyContent="flex-end">
          <Link
            href={vault.link}
            rel="noopener"
            target="_blank"
            _hover={{ textDecoration: 'none' }}
          >
            <Button
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
            >
              Deposit
              <LinkOffIcon ml={1} />
            </Button>
          </Link>
        </Flex>
      </Flex>
    </Fade>
  );
}

const LinkOffIcon = ({ ...props }: IconProps) => (
  <Icon width="14px" height="14px" viewBox="0 0 14 14" fill="none" {...props}>
    <g clipPath="url(#clip0_13614_19286)">
      <path
        d="M9.07955 4.47121L4.65447 4.47121L4.65447 3.30472L11.071 3.30472L11.071 9.72124L9.90451 9.72124L9.90451 5.29617L4.11719 11.325L3.29224 10.5L9.07955 4.47121Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_13614_19286">
        <rect width="14" height="14" fill="white" />
      </clipPath>
    </defs>
  </Icon>
);
