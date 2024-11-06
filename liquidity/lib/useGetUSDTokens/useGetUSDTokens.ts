import { useQuery } from '@tanstack/react-query';
import { Network, useNetwork, useProviderForChain } from '@snx-v3/useBlockchain';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { USDC_BASE_MARKET, isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { ethers } from 'ethers';

export function useGetUSDTokens(customNetwork?: Network) {
  const { network } = useNetwork();

  const targetNetwork = customNetwork || network;
  const provider = useProviderForChain(targetNetwork);

  const isBase = isBaseAndromeda(targetNetwork?.id, targetNetwork?.preset);

  const { data: collateralTypes } = useCollateralTypes(false, customNetwork);
  const { data: SpotMarketProxy } = useSpotMarketProxy(customNetwork);
  const { data: systemToken } = useSystemToken(customNetwork);

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'GetUSDTokens'],
    enabled: Boolean(
      SpotMarketProxy && provider && targetNetwork && collateralTypes?.length && systemToken
    ),
    queryFn: async () => {
      if (
        !(SpotMarketProxy && provider && targetNetwork && collateralTypes?.length && systemToken)
      ) {
        throw 'OMFG';
      }
      const SpotMarketProxyContract = new ethers.Contract(
        SpotMarketProxy.address,
        SpotMarketProxy.abi,
        provider
      );

      const USDC: string = isBase
        ? (await SpotMarketProxyContract.getWrapper(USDC_BASE_MARKET))?.wrapCollateralType
        : undefined;

      return {
        snxUSD: systemToken.address,
        sUSD: collateralTypes?.find((type) =>
          isBase ? type.symbol.toLowerCase() === 'usdc' : type.symbol.toLowerCase() === 'susdc'
        )?.tokenAddress,
        USDC,
      };
    },
  });
}

export const useGetWrapperToken = (marketId: string, customNetwork?: Network) => {
  const { network } = useNetwork();
  const targetNetwork = customNetwork || network;
  const provider = useProviderForChain(targetNetwork);
  const isBase = isBaseAndromeda(targetNetwork?.id, targetNetwork?.preset);
  const { data: SpotMarketProxy } = useSpotMarketProxy(customNetwork);

  return useQuery({
    queryKey: [`${targetNetwork?.id}-${targetNetwork?.preset}`, 'GetWrapperToken', marketId],
    enabled: Boolean(targetNetwork && provider && SpotMarketProxy && isBase),
    queryFn: async () => {
      if (!(targetNetwork && provider && SpotMarketProxy && isBase)) {
        throw 'OMFG';
      }
      const SpotMarketProxyContract = new ethers.Contract(
        SpotMarketProxy.address,
        SpotMarketProxy.abi,
        provider
      );

      return isBase
        ? (await SpotMarketProxyContract.getWrapper(USDC_BASE_MARKET))?.wrapCollateralType
        : undefined;
    },
  });
};
