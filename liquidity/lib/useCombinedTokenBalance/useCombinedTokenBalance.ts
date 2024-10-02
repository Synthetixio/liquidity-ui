import { stringToHash } from '@snx-v3/tsHelpers';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { Network, useNetwork, useProviderForChain, useWallet } from '@snx-v3/useBlockchain';
import { useSNX } from '@snx-v3/useSNX';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useUSDC } from '@snx-v3/useUSDC';
import { useWETH } from '@snx-v3/useWETH';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useCombinedTokenBalance(
  tokenInfo?: {
    address: string;
    symbol: string;
    name: string;
    decimals: string;
  },
  customNetwork?: Network
) {
  const { network: activeNetwork } = useNetwork();
  const { activeWallet } = useWallet();
  const network = customNetwork || activeNetwork;
  const provider = useProviderForChain(network);

  const { data: WETHContract, isPending: isPendingWETH } = useWETH(network);
  const { data: SNXContract, isPending: isPendingSNX } = useSNX(network);
  const { data: AaveUSDCContract, isPending: isPendingAaveUSDC } = useStaticAaveUSDC(network);
  const { data: USDCContract, isPending: isPendingUSDC } = useUSDC(network);
  const { data: SynthTokens, isPending: isPendingSynthTokens } = useSynthTokens(network);

  // We dont want to over-fetch and we should only enable query when all the underlying contracts are resolved
  const isPending =
    isPendingWETH || isPendingSNX || isPendingAaveUSDC || isPendingUSDC || isPendingSynthTokens;

  const walletAddress = activeWallet?.address;

  const contractsHash = stringToHash(
    [WETHContract, SNXContract, AaveUSDCContract, USDCContract, ...(SynthTokens ?? [])]
      .map((t) => t?.address)
      .filter(Boolean)
      .sort()
      .join()
  );

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'CombinedTokenBalance',
      { walletAddress },
      { tokenAddress: tokenInfo?.address ?? '' },
      { contractsHash },
    ],
    enabled: Boolean(network && provider && walletAddress && tokenInfo && !isPending),
    queryFn: async function () {
      if (!(network && provider && walletAddress && tokenInfo && !isPending)) throw 'OMFG';

      if (
        // When dealing with WETH collateral we also add ETH balance
        // and later automatically wrap extra ETH
        WETHContract &&
        tokenInfo.address.toLowerCase() === `${WETHContract.address}`.toLowerCase()
      ) {
        const [balance, decimals, ethBalance] = await Promise.all([
          WETHContract.balanceOf(walletAddress),
          WETHContract.decimals(),
          provider.getBalance(walletAddress),
        ]);
        return {
          combinedBalance: wei(balance).add(ethBalance),
          combinedValue: wei(0), // TODO: fetch price
          main: {
            address: tokenInfo.address,
            symbol: tokenInfo.symbol,
            displayName: tokenInfo.symbol,
            decimals,
            balance: wei(balance),
            price: wei(0), // TODO: fetch price
          },
          swap: {
            address: ethers.constants.AddressZero,
            symbol: 'ETH',
            displayName: 'ETH',
            decimals: 18,
            balance: wei(ethBalance),
            estimatedBalance: wei(ethBalance), // WETH is same price as ETH
            price: wei(0), // TODO: fetch price
          },
        };
      }

      if (
        // When working with SNX token we should show only transferable amount,
        // as balanceOf includes locked and unusable SNX too
        SNXContract &&
        tokenInfo.address.toLowerCase() === `${SNXContract.address}`.toLowerCase()
      ) {
        const [transferableSynthetix] = await Promise.all([
          SNXContract.transferableSynthetix(walletAddress),
        ]);
        return {
          combinedBalance: wei(0).add(transferableSynthetix),
          combinedValue: wei(0), // TODO: fetch price
          main: {
            address: tokenInfo.address,
            symbol: tokenInfo.symbol,
            displayName: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            balance: wei(transferableSynthetix),
            price: wei(0), // TODO: fetch price
          },
        };
      }

      if (
        // Special case of extra swapping of USDC -> Static aUSDC -> Synth Static aUSDC
        AaveUSDCContract &&
        SynthTokens &&
        USDCContract
      ) {
        const synthTokenAaveUSDC = SynthTokens.find(
          (synth) =>
            `${AaveUSDCContract.address}`.toLowerCase() ===
              `${synth.token.address}`.toLowerCase() &&
            tokenInfo.address.toLowerCase() === `${synth.address}`.toLowerCase()
        );
        if (synthTokenAaveUSDC) {
          const SynthAaveUSDCContract = new ethers.Contract(
            synthTokenAaveUSDC.address,
            ['function balanceOf(address user) view returns (uint256)'],
            provider
          );
          const [balanceSynthAaveUSDC_raw, balanceAaveUSDC_raw, balanceUSDC_raw, rateAaveUSDC_raw] =
            await Promise.all([
              SynthAaveUSDCContract.balanceOf(walletAddress),
              AaveUSDCContract.balanceOf(walletAddress),
              USDCContract.balanceOf(walletAddress),
              AaveUSDCContract.rate(),
            ]);
          const balanceSynthAaveUSDC = wei(balanceSynthAaveUSDC_raw, synthTokenAaveUSDC.decimals);
          const balanceAaveUSDC = wei(balanceAaveUSDC_raw, synthTokenAaveUSDC.token.decimals);
          const balanceUSDC = wei(balanceUSDC_raw, 6);
          const rateAaveUSDC = wei(rateAaveUSDC_raw, 27); // why 27, why :facepalm:

          const priceUSDC = wei(1);
          const priceAaveUSDC = wei(priceUSDC).mul(rateAaveUSDC);
          const estimatedBalance = balanceUSDC.mul(priceUSDC).div(priceAaveUSDC);

          const balance = wei(0)
            .add(balanceSynthAaveUSDC)
            .add(balanceAaveUSDC)
            .add(estimatedBalance);
          const value = balance.mul(priceAaveUSDC);

          return {
            balance,
            value,
            main: {
              address: synthTokenAaveUSDC.token.address,
              symbol: synthTokenAaveUSDC.token.symbol,
              displayName: 'Static aUSDC',
              decimals: synthTokenAaveUSDC.token.decimals,
              balance: wei(0).add(balanceSynthAaveUSDC).add(balanceAaveUSDC),
              price: priceAaveUSDC,
            },
            swap: {
              address: USDCContract.address,
              symbol: 'USDC',
              displayName: 'USDC',
              decimals: 6,
              balance: wei(0).add(balanceUSDC),
              estimatedBalance,
              price: priceUSDC,
            },
          };
        }
      }

      if (
        // Generic case for all Synth tokens
        // We combine balance of synth token and unwrapped token and display name will be the name of unwrapped token
        SynthTokens
      ) {
        const synthToken = SynthTokens.find(
          (synth) => tokenInfo.address.toLowerCase() === `${synth.address}`.toLowerCase()
        );
        if (synthToken) {
          const SynthTokenContract = new ethers.Contract(
            synthToken.address,
            ['function balanceOf(address user) view returns (uint256)'],
            provider
          );
          const TokenContract = new ethers.Contract(
            synthToken.token.address,
            ['function balanceOf(address user) view returns (uint256)'],
            provider
          );
          const [balanceSynthToken_raw, balanceToken_raw] = await Promise.all([
            SynthTokenContract.balanceOf(walletAddress),
            TokenContract.balanceOf(walletAddress),
          ]);
          const balanceSynthToken = wei(balanceSynthToken_raw, synthToken.decimals);
          const balanceToken = wei(balanceToken_raw, synthToken.token.decimals);
          return {
            combinedBalance: wei(0).add(balanceSynthToken).add(balanceToken),
            combinedValue: wei(0), // TODO: fetch price
            main: {
              address: synthToken.token.address,
              symbol: synthToken.token.symbol,
              displayName: synthToken.token.symbol,
              decimals: synthToken.token.decimals,
              balance: wei(0).add(balanceToken).add(balanceSynthToken),
              price: wei(0), // TODO: fetch price
            },
          };
        }
      }

      // For all the other tokens, use only normal balance
      const TokenContract = new ethers.Contract(
        tokenInfo.address,
        ['function balanceOf(address user) view returns (uint256)'],
        provider
      );
      const [balanceToken_raw] = await Promise.all([TokenContract.balanceOf(walletAddress)]);
      const balanceToken = wei(balanceToken_raw, Number(tokenInfo.decimals));
      return {
        combinedBalance: wei(0).add(balanceToken),
        combinedValue: wei(0), // TODO: fetch price
        main: {
          address: tokenInfo.address,
          symbol: tokenInfo.symbol,
          displayName: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          balance: balanceToken,
          price: wei(0), // TODO: fetch price
        },
      };
    },
  });
}
