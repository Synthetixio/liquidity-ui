import { useNetwork } from '@snx-v3/useBlockchain';

export function useSynthetix() {
  const { network } = useNetwork();

  return {
    chainId: network?.id,
    preset: network?.preset,
  };
}
