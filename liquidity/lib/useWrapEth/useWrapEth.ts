import { useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useEthBalance } from '@snx-v3/useEthBalance';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import Wei from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { Contract } from 'ethers';
import { useCallback } from 'react';

const log = debug('snx:useWrapEth');

export const useWrapEth = () => {
  const signer = useSigner();
  const provider = useProvider();

  const { data: ethCollateral } = useCollateralType('WETH');
  const { data: ethBalance, refetch: refetchETHBalance } = useEthBalance();
  const { data: wethBalance, refetch: refetchWETHBalance } = useTokenBalance(
    ethCollateral?.tokenAddress
  );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (amount: Wei) => {
      if (!ethCollateral || !signer || !provider) return;
      const contract = new Contract(
        ethCollateral?.tokenAddress,
        ['function deposit() payable'],
        signer
      );
      const txn = await contract.deposit({ value: amount.toBN() });
      log('txn', txn);
      const receipt = await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);
      return receipt;
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
  const provider = useProvider();

  const { data: ethCollateral } = useCollateralType('WETH');
  const { data: ethBalance, refetch: refetchETHBalance } = useEthBalance();
  const { data: wethBalance, refetch: refetchWETHBalance } = useTokenBalance(
    ethCollateral?.tokenAddress
  );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (amount: Wei) => {
      if (!ethCollateral || !signer || !provider) return;
      const contract = new Contract(
        ethCollateral?.tokenAddress,
        ['function withdraw(uint256 wad)'],
        signer
      );
      const txn = await contract.withdraw(amount.toBN());
      log('txn', txn);
      const receipt = await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);
      return receipt;
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
