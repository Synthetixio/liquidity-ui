import { contractsHash } from '@snx-v3/tsHelpers';
import { Network, useNetwork, useProviderForChain, useWallet } from '@snx-v3/useBlockchain';
import { CollateralType } from '@snx-v3/useCollateralTypes';
import { useSNX } from '@snx-v3/useSNX';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { useUSDC } from '@snx-v3/useUSDC';
import { useWETH } from '@snx-v3/useWETH';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { offchainMainnetEndpoint } from '@snx-v3/constants';
import { fetchOraclePrice } from '@snx-v3/useOraclePrice';

const priceService = new EvmPriceServiceConnection(offchainMainnetEndpoint);

export async function fetchPythPrice(pythFeedId: string) {
  const priceFeeds = await priceService.getLatestPriceFeeds([pythFeedId]);
  const price = priceFeeds?.[0].getPriceUnchecked();
  return price ? wei(price.price, 18 + price.expo) : wei(0);
}

export async function fetchCollateralPrice({
  collateralType,
  network,
  provider,
}: {
  collateralType: CollateralType;
  network: Network;
  provider: ethers.providers.BaseProvider;
}) {
  // Constant price
  if (collateralType.oracle.constPrice) {
    return collateralType.oracle.constPrice;
  }

  // Pyth oracle
  if (collateralType.oracle.pythFeedId) {
    // TODO: We can optimise this by pre-fetching all prices for all the feeds and cache for a while
    return fetchPythPrice(collateralType.oracle.pythFeedId);
  }

  if (collateralType.oracle.externalContract) {
    const oraclePrice = await fetchOraclePrice({
      nodeId: collateralType.oracleNodeId,
      provider,
      targetNetwork: network,
    });
    return oraclePrice.price;
  }

  // Special case for SNX
  // TODO: SNX uses Chainlink oracle price, we should refactor price fetcher to resolve it from Chainlink instead
  // At this moment existing implementation relies on Pyth price, so there is no change in functionality
  if (collateralType.symbol === 'SNX' && collateralType.name === 'Synthetix Network Token') {
    const SNX_PYTH_FEED = '0x39d020f60982ed892abbcd4a06a276a9f9b7bfbce003204c110b6e488f502da3';
    return fetchPythPrice(SNX_PYTH_FEED);
  }

  // fallback to 0 price, realistically this fallback should never happen,
  // but if it does we want UI to carry on
  return wei(0);
}

export function useCombinedTokenBalance(collateralType?: CollateralType, customNetwork?: Network) {
  const { network: activeNetwork } = useNetwork();
  const { activeWallet } = useWallet();
  const network = customNetwork || activeNetwork;
  const provider = useProviderForChain(network);

  const { data: WETH, isPending: isPendingWETH } = useWETH(network);
  const { data: SNX, isPending: isPendingSNX } = useSNX(network);
  const { data: AaveUSDC, isPending: isPendingAaveUSDC } = useStaticAaveUSDC(network);
  const { data: USDC, isPending: isPendingUSDC } = useUSDC(network);
  const { data: SynthTokens, isPending: isPendingSynthTokens } = useSynthTokens(network);

  // We dont want to over-fetch and we should only enable query when all the underlying contracts are resolved
  const isPending =
    isPendingWETH || isPendingSNX || isPendingAaveUSDC || isPendingUSDC || isPendingSynthTokens;

  const walletAddress = activeWallet?.address;

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'CombinedTokenBalance',
      { walletAddress },
      { tokenAddress: collateralType?.address ?? '' },
      {
        contractsHash: contractsHash([WETH, SNX, AaveUSDC, USDC, ...(SynthTokens ?? [])]),
      },
    ],
    enabled: Boolean(network && provider && walletAddress && collateralType && !isPending),
    queryFn: async function () {
      if (!(network && provider && walletAddress && collateralType && !isPending)) throw 'OMFG';

      if (
        // When dealing with WETH collateral we also add ETH balance
        // and later automatically wrap extra ETH
        WETH &&
        collateralType.address.toLowerCase() === `${WETH.address}`.toLowerCase()
      ) {
        const WETHContract = new ethers.Contract(WETH.address, WETH.abi, provider);
        const [balance, decimals, ethBalance, price] = await Promise.all([
          WETHContract.balanceOf(walletAddress),
          WETHContract.decimals(),
          provider.getBalance(walletAddress),
          fetchCollateralPrice({ network, provider, collateralType }),
        ]);
        const combinedBalance = wei(balance).add(ethBalance);
        const combinedValue = combinedBalance.mul(price);
        return {
          combinedBalance,
          combinedValue,
          main: {
            address: collateralType.address,
            symbol: collateralType.symbol,
            displayName: collateralType.symbol,
            decimals,
            balance: wei(balance),
            price,
          },
          swap: {
            address: ethers.constants.AddressZero,
            symbol: 'ETH',
            displayName: 'ETH',
            decimals: 18,
            balance: wei(ethBalance),
            estimatedBalance: wei(ethBalance),
            price,
          },
        };
      }

      if (
        // When working with SNX token we should show only transferable amount,
        // as balanceOf includes locked and unusable SNX too
        SNX &&
        collateralType.address.toLowerCase() === `${SNX.address}`.toLowerCase()
      ) {
        const SNXContract = new ethers.Contract(SNX.address, SNX.abi, provider);
        const [transferableSynthetix, price] = await Promise.all([
          SNXContract.transferableSynthetix(walletAddress).catch((e: Error) => {
            console.error(e);
            return wei(0);
          }), // if account has no SNX
          fetchCollateralPrice({ network, provider, collateralType }),
        ]);
        const combinedBalance = wei(0).add(transferableSynthetix);
        const combinedValue = combinedBalance.mul(price);
        return {
          combinedBalance,
          combinedValue,
          main: {
            address: collateralType.address,
            symbol: collateralType.symbol,
            displayName: collateralType.symbol,
            decimals: collateralType.decimals,
            balance: wei(transferableSynthetix),
            price,
          },
        };
      }

      if (
        // Special case of extra swapping of USDC -> Static aUSDC -> Synth Static aUSDC
        AaveUSDC &&
        SynthTokens &&
        USDC
      ) {
        const AaveUSDCContract = new ethers.Contract(AaveUSDC.address, AaveUSDC.abi, provider);
        const USDCContract = new ethers.Contract(USDC.address, USDC.abi, provider);

        const synthTokenAaveUSDC = SynthTokens.find(
          (synth) =>
            `${AaveUSDC.address}`.toLowerCase() === `${synth.token.address}`.toLowerCase() &&
            collateralType.address.toLowerCase() === `${synth.address}`.toLowerCase()
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
          const rateAaveUSDC = wei(rateAaveUSDC_raw, 27);

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
              address: USDC.address,
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
          (synth) => collateralType.address.toLowerCase() === `${synth.address}`.toLowerCase()
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

          const [balanceSynthToken_raw, balanceToken_raw, price] = await Promise.all([
            SynthTokenContract.balanceOf(walletAddress),
            TokenContract.balanceOf(walletAddress),
            fetchCollateralPrice({ network, provider, collateralType }),
          ]);
          const balanceOfSynthToken = wei(balanceSynthToken_raw, synthToken.decimals);
          const balanceOfToken = wei(balanceToken_raw, synthToken.token.decimals);
          const combinedBalance = wei(0).add(balanceOfSynthToken).add(balanceOfToken);
          const combinedValue = combinedBalance.mul(price);
          return {
            combinedBalance,
            combinedValue,
            main: {
              address: synthToken.token.address,
              symbol: synthToken.token.symbol,
              displayName: synthToken.token.symbol,
              decimals: synthToken.token.decimals,
              balance: wei(0).add(balanceOfToken).add(balanceOfSynthToken),
              price,
            },
          };
        }
      }

      // For all the other tokens, use only normal balance
      const TokenContract = new ethers.Contract(
        collateralType.address,
        ['function balanceOf(address user) view returns (uint256)'],
        provider
      );
      const [balanceToken_raw, price] = await Promise.all([
        TokenContract.balanceOf(walletAddress),
        fetchCollateralPrice({ network, provider, collateralType }),
      ]);
      const balanceToken = wei(balanceToken_raw, collateralType.decimals);
      const combinedBalance = wei(0).add(balanceToken);
      const combinedValue = combinedBalance.mul(price);
      return {
        combinedBalance,
        combinedValue,
        main: {
          address: collateralType.address,
          symbol: collateralType.symbol,
          displayName: collateralType.symbol,
          decimals: collateralType.decimals,
          balance: balanceToken,
          price,
        },
      };
    },
  });
}
