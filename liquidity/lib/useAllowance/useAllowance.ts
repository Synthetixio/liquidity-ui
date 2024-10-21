import { useQuery } from '@tanstack/react-query';
import { useWallet, useNetwork, useDefaultProvider } from '@snx-v3/useBlockchain';
import { BigNumber, Contract } from 'ethers';

const abi = ['function allowance(address, address) view returns (uint256)'];

export const useAllowance = ({
  contractAddress,
  spender,
}: {
  contractAddress?: string;
  spender?: string;
}) => {
  const { activeWallet } = useWallet();
  const { network } = useNetwork();
  const provider = useDefaultProvider();

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'Allowance',
      { accountAddress: activeWallet?.address },
      { contractAddress, spender },
    ],
    queryFn: async () => {
      if (!(contractAddress && spender && activeWallet?.address && provider))
        throw new Error('OMG');
      const contract = new Contract(contractAddress, abi, provider);
      const allowance = await contract.allowance(activeWallet.address, spender);

      return BigNumber.from(allowance);
    },
    enabled: Boolean(activeWallet?.address && contractAddress && spender && provider),
  });
};
