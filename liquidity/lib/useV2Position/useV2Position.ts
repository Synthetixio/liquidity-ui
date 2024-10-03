import { useQuery } from '@tanstack/react-query';
import { Network, useWallet } from '@snx-v3/useBlockchain';
import { useV2xSynthetix } from '@snx-v3/useV2xSynthetix';
import { wei } from '@synthetixio/wei';
import { utils } from 'ethers';
import { useMulticall3 } from '@snx-v3/useMulticall3';

export function useV2Position(network: Network) {
  const { data: v2xSynthetix } = useV2xSynthetix(network);
  const { activeWallet } = useWallet();
  const { data: Multicall3 } = useMulticall3(network);

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'V2Position',
      {
        wallet: activeWallet?.address,
      },
    ],
    queryFn: async function () {
      if (!(v2xSynthetix && Multicall3)) {
        throw 'should be disabled';
      }

      const calls = [
        {
          target: v2xSynthetix.address,
          callData: v2xSynthetix.interface.encodeFunctionData('collateral', [
            activeWallet?.address,
          ]),
        },
        {
          target: v2xSynthetix.address,
          callData: v2xSynthetix.interface.encodeFunctionData('balanceOf', [activeWallet?.address]),
        },

        {
          target: v2xSynthetix.address,
          callData: v2xSynthetix.interface.encodeFunctionData('debtBalanceOf', [
            activeWallet?.address,
            utils.formatBytes32String('sUSD'),
          ]),
        },
        {
          target: v2xSynthetix.address,
          callData: v2xSynthetix.interface.encodeFunctionData('collateralisationRatio', [
            activeWallet?.address,
          ]),
        },
        {
          target: v2xSynthetix.address,
          callData: v2xSynthetix.interface.encodeFunctionData('transferableSynthetix', [
            activeWallet?.address,
          ]),
        },
      ];
      const { returnData } = await Multicall3.callStatic.aggregate(calls);

      const [collateral, balance, debt, cratio, transferableSynthetix] = [
        wei(v2xSynthetix.interface.decodeFunctionResult('collateral', returnData[0])[0]),
        wei(v2xSynthetix.interface.decodeFunctionResult('collateral', returnData[1])[0]),
        wei(v2xSynthetix.interface.decodeFunctionResult('collateral', returnData[2])[0]),
        wei(v2xSynthetix.interface.decodeFunctionResult('collateral', returnData[3])[0]),
        wei(v2xSynthetix.interface.decodeFunctionResult('collateral', returnData[4])[0]),
      ];

      return {
        collateral,
        balance,
        debt,
        cratio,
        transferableSynthetix,
      };
    },
    enabled: Boolean(v2xSynthetix && activeWallet?.address && Multicall3),
    staleTime: Infinity,
  });
}
