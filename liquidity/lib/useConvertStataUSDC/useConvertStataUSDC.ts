import { D18, D27, D6 } from '@snx-v3/constants';
import { useNetwork, useSigner, useWallet } from '@snx-v3/useBlockchain';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { debug } from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useConvertStataUSDC');

export function useConvertStataUSDC({
  stataAmountNeeded, // 18 decimals!
  depositToAave,
}: {
  stataAmountNeeded: ethers.BigNumber;
  depositToAave: boolean;
}) {
  const { network } = useNetwork();
  const signer = useSigner();
  const { data: StaticAaveUSDC } = useStaticAaveUSDC();
  const queryClient = useQueryClient();
  const { activeWallet } = useWallet();

  return useMutation({
    mutationFn: async () => {
      if (!(StaticAaveUSDC && signer && activeWallet)) {
        throw new Error('Not ready');
      }
      if (!stataAmountNeeded.gt(0)) {
        return;
      }

      const StaticAaveUSDCContract = new ethers.Contract(
        StaticAaveUSDC.address,
        StaticAaveUSDC.abi,
        signer
      );

      // 27 decimals!
      const stataRate = await StaticAaveUSDCContract.rate();
      log('stataRate (27 decimals)', stataRate, `${stataRate}`);

      log('stataAmountNeeded (18 decimals)', stataAmountNeeded, `${stataAmountNeeded}`);
      const stataAmount = stataAmountNeeded
        // Adjust precision down from 18 to 6
        .mul(D6)
        .div(D18);
      log('stataAmount (6 decimals)', stataAmount, `${stataAmount}`);
      const usdcAmountWithBuffer = stataAmount
        .mul(stataRate)
        .div(D27)

        // give it one extra percent buffer
        .mul(101)
        .div(100);
      log('usdcAmountWithBuffer (6 decimals)', usdcAmountWithBuffer, `${usdcAmountWithBuffer}`);

      // 'function deposit(uint256 assets, address receiver, uint16 referralCode, bool depositToAave) returns (uint256)',
      const args = [
        usdcAmountWithBuffer,
        activeWallet.address,
        0, // TODO: get referral code from AAVE
        depositToAave,
      ];
      const gasLimit = await StaticAaveUSDCContract.estimateGas[
        'deposit(uint256,address,uint16,bool)'
      ](...args);
      const txn = await StaticAaveUSDCContract['deposit(uint256,address,uint16,bool)'](...args, {
        gasLimit: gasLimit.mul(2),
      });
      log('txn', txn);

      const receipt = await txn.wait();
      log('receipt', receipt);

      return receipt;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'Allowance'],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
      });
    },
  });
}
