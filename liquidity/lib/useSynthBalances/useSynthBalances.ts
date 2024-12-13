import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider, useWallet } from '@snx-v3/useBlockchain';
import { useMulticall3 } from '@snx-v3/useMulticall3';
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
  const { data: Multicall3 } = useMulticall3();

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
      const multicall = [
        ...synthTokens.map((synth) => ({
          method: 'balanceOf',
          args: [walletAddress],
          synth,
          isSynth: true,
        })),
        ...synthTokens.map((synth) => ({
          method: 'balanceOf',
          args: [walletAddress],
          synth,
          isSynth: false,
        })),
      ];
      log('multicall', multicall);

      const calls = multicall.map(({ method, args, synth, isSynth }) => ({
        target: isSynth ? synth.address : synth.token.address,
        callData: TokenInterface.encodeFunctionData(method, args),
        allowFailure: true,
      }));
      log('calls', calls);

      const Multicall3Contract = new ethers.Contract(Multicall3.address, Multicall3.abi, provider);
      const multicallResponse = await Multicall3Contract.callStatic.aggregate3(calls);
      log('multicallResponse', multicallResponse);

      const balances = multicall
        .map(({ method, synth, isSynth }, i) => {
          const { success, returnData } = multicallResponse[i];
          if (!success) {
            log(`${method} call error for ${synth.symbol}`);
            return;
          }
          const [balance] = TokenInterface.decodeFunctionResult(method, returnData);
          return {
            synth,
            balance: wei(balance, isSynth ? synth.decimals : synth.token.decimals),
            isSynth,
          };
        })
        .filter((info) => info !== undefined);
      log('balances', balances);
      const map = new Map();
      balances.forEach(({ synth, balance, isSynth }) => {
        if (map.has(synth.address)) {
          map.set(synth.address, {
            synth,
            synthBalance: isSynth ? balance : map.get(synth.address).synthBalance,
            tokenBalance: isSynth ? map.get(synth.address).tokenBalance : balance,
          });
        } else {
          map.set(synth.address, {
            synth,
            synthBalance: isSynth ? balance : wei(0, synth.token.decimals),
            tokenBalance: isSynth ? wei(0, synth.decimals) : balance,
          });
        }
      });
      const combinedBalances = map.values().toArray();
      log('combinedBalances', combinedBalances);
      return combinedBalances;
    },
  });
}
