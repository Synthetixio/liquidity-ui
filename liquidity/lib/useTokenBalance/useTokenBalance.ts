import { Network, useNetwork, useProviderForChain, useWallet } from '@snx-v3/useBlockchain';
import { wei } from '@synthetixio/wei';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

export const abi = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export const useTokenBalance = (tokenAddress?: string, customNetwork?: Network) => {
  const { activeWallet } = useWallet();
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const provider = useProviderForChain(targetNetwork);
  const walletAddress = activeWallet?.address;
  return useQuery({
    enabled: Boolean(walletAddress && tokenAddress && provider && targetNetwork),
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'TokenBalance',
      { accountAddress: walletAddress, tokenAddress },
    ],
    queryFn: async () => {
      if (!(walletAddress && tokenAddress && provider && targetNetwork)) {
        throw 'OMFG';
      }

      const TokenContract = new ethers.Contract(tokenAddress, abi, provider);
      const [balance, decimals] = await Promise.all([
        TokenContract.balanceOf(walletAddress),
        TokenContract.decimals(),
      ]);
      return { balance, decimals };
    },
    select: ({ balance, decimals }) => wei(balance, decimals),
    refetchInterval: 120_000,
  });
};

export const useTokenBalances = (tokenAddresses: string[], customNetwork?: Network) => {
  const { activeWallet } = useWallet();
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const provider = useProviderForChain(targetNetwork);
  const walletAddress = activeWallet?.address;

  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [
      `${targetNetwork?.id}-${targetNetwork?.preset}`,
      'TokenBalance',
      {
        accountAddress: walletAddress,
        tokenAddresses: tokenAddresses.map((a) => a.slice(2, 6).toLowerCase()).sort(),
      },
    ],
    enabled: Boolean(walletAddress && tokenAddresses.length && provider && targetNetwork),

    queryFn: async () => {
      if (!(walletAddress && tokenAddresses.length && provider && targetNetwork)) {
        throw 'OMFG';
      }

      return await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
          const TokenContract = new ethers.Contract(tokenAddress, abi, provider);
          const [balance, decimals] = await Promise.all([
            TokenContract.balanceOf(walletAddress),
            TokenContract.decimals(),
          ]);
          queryClient.setQueryData(
            [
              `${targetNetwork?.id}-${targetNetwork?.preset}`,
              'TokenBalance',
              {
                accountAddress: walletAddress,
                tokenAddresses: tokenAddresses.map((a) => a.slice(2, 6).toLowerCase()).sort(),
              },
            ],
            { balance, decimals }
          );
          return { balance, decimals };
        })
      );
    },
    select: (balances) => balances.map(({ balance, decimals }) => wei(balance, decimals)),
    refetchInterval: 120_000,
  });
};
