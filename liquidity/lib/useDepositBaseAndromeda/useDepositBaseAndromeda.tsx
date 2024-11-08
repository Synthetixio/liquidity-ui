import { parseUnits } from '@snx-v3/format';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { approveAbi } from '@snx-v3/useApprove';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useGetUSDTokens } from '@snx-v3/useGetUSDTokens';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { tokenAbi } from '@snx-v3/useTokenBalance';
// import { useSynthTokens } from '@snx-v3/useSynthTokens';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei, { wei } from '@synthetixio/wei';
import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { useReducer } from 'react';

export const useDepositBaseAndromeda = ({
  accountId,
  newAccountId,
  poolId,
  collateralTypeAddress,
  collateralChange,
  currentCollateral,
  availableCollateral,
  collateralSymbol,
}: {
  accountId?: string;
  newAccountId: string;
  poolId?: string;
  collateralTypeAddress?: string;
  currentCollateral: Wei;
  availableCollateral?: Wei;
  collateralChange: Wei;
  collateralSymbol?: string;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();
  const { data: usdTokens } = useGetUSDTokens();
  const { data: collateralType } = useCollateralType(collateralSymbol);
  const { data: synthTokens } = useSynthTokens();
  const synth = synthTokens?.find(
    (synth) => synth.address.toLowerCase() === collateralType?.tokenAddress.toLowerCase()
  );

  const { gasSpeed } = useGasSpeed();

  const { network } = useNetwork();
  const signer = useSigner();
  const provider = useProvider();

  const mutation = useMutation({
    mutationFn: async () => {
      if (
        !(
          network &&
          provider &&
          signer &&
          CoreProxy &&
          SpotMarketProxy &&
          poolId &&
          collateralTypeAddress &&
          availableCollateral &&
          usdTokens?.sUSD
        )
      ) {
        return;
      }

      if (collateralChange.eq(0)) return;

      try {
        // Steps:
        // 1. Create an account if not exists
        // 2. Wrap USDC or stataUSDC to sUSDC or sStataUSDC
        // 3. Approve sUSDC or sStataUSDC
        // 4. Deposit sUSDC or sStataUSDC
        // 5. Delegate collateral

        dispatch({ type: 'prompting' });
        const id = accountId ?? newAccountId;

        const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);
        const SpotMarketProxyContract = new ethers.Contract(
          SpotMarketProxy.address,
          SpotMarketProxy.abi,
          signer
        );

        // create account only when no account exists
        const createAccount = accountId
          ? undefined
          : CoreProxyContract.populateTransaction['createAccount(uint128)'](
              ethers.BigNumber.from(id)
            );

        const collateralUpdate = wei(collateralChange.toNumber().toFixed(6));
        let amount = collateralUpdate.sub(availableCollateral);

        const TokenContract = new ethers.Contract(synth?.token.address || '', tokenAbi, signer);
        const balance = formatUnits(await TokenContract.balanceOf(await signer.getAddress()), 6);

        if (amount.gt(0) && amount.gt(balance) && amount.sub(balance).div(amount).lt(0.01)) {
          amount = wei(balance.toString());
        }

        const collateralAmount = amount.gt(0)
          ? parseUnits(amount.toString(), 6)
          : ethers.BigNumber.from(0);

        const amountD18 = amount.gt(0)
          ? parseUnits(collateralAmount.toString(), 12)
          : ethers.BigNumber.from(0);

        // Wrap
        const wrap = collateralAmount.gt(0)
          ? SpotMarketProxyContract.populateTransaction.wrap(
              synth?.synthMarketId,
              collateralAmount,
              amountD18
            )
          : undefined;

        // Synth
        const synthAddress = collateralType?.tokenAddress;
        if (!synthAddress) {
          throw 'synth not found';
        }
        const SynthContract = new ethers.Contract(synthAddress, approveAbi, signer);

        const synthApproval = amountD18.gt(0)
          ? SynthContract.populateTransaction.approve(CoreProxy.address, amountD18)
          : undefined;

        // optionally deposit if available collateral not enough
        const deposit = amountD18.gt(0)
          ? CoreProxyContract.populateTransaction.deposit(
              ethers.BigNumber.from(id),
              synthAddress,
              amountD18 // only deposit what's needed
            )
          : undefined;

        const delegate = CoreProxyContract.populateTransaction.delegateCollateral(
          ethers.BigNumber.from(id),
          ethers.BigNumber.from(poolId),
          synthAddress,
          currentCollateral
            .toBN()
            .add(amountD18)
            .add(parseUnits(availableCollateral, 18))
            .toString(),
          wei(1).toBN()
        );

        const callsPromise = Promise.all(
          [wrap, synthApproval, createAccount, deposit, delegate].filter(notNil)
        );

        const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);

        if (priceUpdateTx) {
          calls.unshift(priceUpdateTx as any);
        }

        const walletAddress = await signer.getAddress();

        const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
          network,
          calls,
          'useDepositBaseAndromeda',
          walletAddress
        );

        const gasOptionsForTransaction = formatGasPriceForTransaction({
          gasLimit,
          gasPrices,
          gasSpeed,
        });

        const txn = await signer.sendTransaction({ ...erc7412Tx, ...gasOptionsForTransaction });
        dispatch({ type: 'pending', payload: { txnHash: txn.hash } });

        await txn.wait();
        dispatch({ type: 'success' });
      } catch (error: any) {
        dispatch({ type: 'error', payload: { error } });
        throw error;
      }
    },
    onSuccess: () => {
      // After mutation withERC7412, we guaranteed to have updated all the prices, dont care about await
      refetchPriceUpdateTx();
    },
  });
  return {
    mutation,
    txnState,
    settle: () => dispatch({ type: 'settled' }),
    isLoading: mutation.isPending,
    exec: mutation.mutateAsync,
  };
};
