import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider, useWallet } from '@snx-v3/useBlockchain';
import { useTrustedMulticallForwarder } from '@snx-v3/useTrustedMulticallForwarder';
import { useV2xSynthetix } from '@snx-v3/useV2xSynthetix';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useV2Position() {
  const { network } = useNetwork();
  const provider = useProvider();
  const { activeWallet } = useWallet();
  const { data: Multicall3 } = useTrustedMulticallForwarder(network);
  const { data: V2xSynthetix } = useV2xSynthetix(network);
  const walletAddress = activeWallet?.address;

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'V2Position',
      { walletAddress },
      { contractsHash: contractsHash([V2xSynthetix, Multicall3]) },
    ],
    enabled: Boolean(provider && walletAddress && V2xSynthetix && Multicall3),
    queryFn: async function () {
      if (!(provider && walletAddress && V2xSynthetix && Multicall3)) throw 'OMFG';
      const V2xSynthetixInterface = new ethers.utils.Interface(V2xSynthetix.abi);

      const calls = [
        {
          target: V2xSynthetix.address,
          callData: V2xSynthetixInterface.encodeFunctionData('collateral', [walletAddress]),
        },
        {
          target: V2xSynthetix.address,
          callData: V2xSynthetixInterface.encodeFunctionData('balanceOf', [walletAddress]),
        },

        {
          target: V2xSynthetix.address,
          callData: V2xSynthetixInterface.encodeFunctionData('debtBalanceOf', [
            walletAddress,
            ethers.utils.formatBytes32String('sUSD'),
          ]),
        },
        {
          target: V2xSynthetix.address,
          callData: V2xSynthetixInterface.encodeFunctionData('collateralisationRatio', [
            walletAddress,
          ]),
        },
        {
          target: V2xSynthetix.address,
          callData: V2xSynthetixInterface.encodeFunctionData('transferableSynthetix', [
            walletAddress,
          ]),
        },
      ];

      const Multicall3Contract = new ethers.Contract(Multicall3.address, Multicall3.abi, provider);
      const { returnData } = await Multicall3Contract.callStatic.aggregate(calls);

      const [collateral, balance, debt, cratio, transferableSynthetix] = [
        wei(V2xSynthetixInterface.decodeFunctionResult('collateral', returnData[0])[0]),
        wei(V2xSynthetixInterface.decodeFunctionResult('collateral', returnData[1])[0]),
        wei(V2xSynthetixInterface.decodeFunctionResult('collateral', returnData[2])[0]),
        wei(V2xSynthetixInterface.decodeFunctionResult('collateral', returnData[3])[0]),
        wei(V2xSynthetixInterface.decodeFunctionResult('collateral', returnData[4])[0]),
      ];

      return {
        collateral,
        balance,
        debt,
        cratio,
        transferableSynthetix,
      };
    },
  });
}
