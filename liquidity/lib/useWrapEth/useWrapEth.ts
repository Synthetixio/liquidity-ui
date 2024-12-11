import { useNetwork, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useEthBalance } from '@snx-v3/useEthBalance';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { Contract } from 'ethers';
import { useMutation } from '@tanstack/react-query';
import Wei from '@synthetixio/wei';
import { useCallback } from 'react';
import { txWait } from '@snx-v3/txWait';

const minimalWETHABI = ['function deposit() payable', 'function withdraw(uint256 wad)'];

export const useWrapEth = () => {
  const signer = useSigner();
  const { network } = useNetwork();

  const { data: ethCollateral } = useCollateralType('WETH');
  const { data: ethBalance, refetch: refetchETHBalance } = useEthBalance();
  const { data: wethBalance, refetch: refetchWETHBalance } = useTokenBalance(
    ethCollateral?.tokenAddress
  );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (amount: Wei) => {
      if (!ethCollateral || !signer || !network) return;
      const contract = new Contract(ethCollateral?.tokenAddress, minimalWETHABI, signer);
      const txn = await contract.deposit({ value: amount.toBN() });
      await txWait(txn, network);
    },
  });

  const exec = useCallback(
    async (amount: Wei) => {
      if (!ethBalance) return;
      if (ethBalance.lt(amount)) {
        throw new Error('Amount exceeds balance');
      }
      await mutateAsync(amount);
      refetchETHBalance();
      refetchWETHBalance();
    },
    [ethBalance, mutateAsync, refetchETHBalance, refetchWETHBalance]
  );

  return {
    exec,
    isLoading: isPending,
    wethBalance,
    ethBalance,
  };
};

export const useUnWrapEth = () => {
  const signer = useSigner();
  const { network } = useNetwork();

  const { data: ethCollateral } = useCollateralType('WETH');
  const { data: ethBalance, refetch: refetchETHBalance } = useEthBalance();
  const { data: wethBalance, refetch: refetchWETHBalance } = useTokenBalance(
    ethCollateral?.tokenAddress
  );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (amount: Wei) => {
      if (!ethCollateral || !signer || !network) return;
      const contract = new Contract(ethCollateral?.tokenAddress, minimalWETHABI, signer);
      const txn = await contract.withdraw(amount.toBN());
      await txWait(txn, network);
    },
  });

  const exec = useCallback(
    async (amount: Wei) => {
      if (!wethBalance) return;
      if (wethBalance.lt(amount)) return;
      await mutateAsync(amount);
      await Promise.all([refetchETHBalance(), refetchWETHBalance()]);
    },
    [mutateAsync, refetchETHBalance, refetchWETHBalance, wethBalance]
  );

  return {
    exec,
    isLoading: isPending,
    wethBalance,
    ethBalance,
  };
};
