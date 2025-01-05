import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider, useWallet } from '@snx-v3/useBlockchain';
import { useTrustedMulticallForwarder } from '@snx-v3/useTrustedMulticallForwarder';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { wei } from '@synthetixio/wei';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useSynthBalances');

export function useSynthBalances() {
  const { network } = useNetwork();
  const provider = useProvider();
  const { activeWallet } = useWallet();
  const walletAddress = activeWallet?.address;

  const { data: synthTokens } = useSynthTokens();
  const { data: Multicall3 } = useTrustedMulticallForwarder();

  return useQuery({
    enabled: Boolean(network && Multicall3 && synthTokens && walletAddress),
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'SynthBalances',
      { walletAddress },
      {
        contractsHash: contractsHash([Multicall3, ...(synthTokens ?? [])]),
      },
    ],
    queryFn: async () => {
      if (!(network && Multicall3 && synthTokens && walletAddress)) {
        throw new Error('OMG');
      }
      log('synthTokens', synthTokens);

      const TokenInterface = new ethers.utils.Interface([
        'function balanceOf(address) view returns (uint256)',
      ]);
      const multicall = synthTokens.map((synth) => ({
        synth,
        method: 'balanceOf',
        args: [walletAddress],
        target: synth.address,
        callData: TokenInterface.encodeFunctionData('balanceOf', [walletAddress]),
        allowFailure: true,
      }));
      log('multicall', multicall);

      const Multicall3Contract = new ethers.Contract(Multicall3.address, Multicall3.abi, provider);
      const multicallResponse = await Multicall3Contract.callStatic.aggregate3(
        multicall.map(({ target, callData, allowFailure }) => ({
          target,
          callData,
          allowFailure,
        }))
      );
      log('multicallResponse', multicallResponse);

      const balances = multicall
        .map(({ method, synth }, i) => {
          const { success, returnData } = multicallResponse[i];
          if (!success) {
            log(`${method} call error for ${synth.symbol}`);
            return;
          }
          const [balance] = TokenInterface.decodeFunctionResult(method, returnData);
          return {
            synth,
            balance: wei(balance, synth.decimals),
          };
        })
        .filter((info) => info !== undefined);
      log('balances', balances);

      return balances;
    },
  });
}
