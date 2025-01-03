import { D18, POOL_ID } from '@snx-v3/constants';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { approveAbi } from '@snx-v3/useApprove';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSynthToken } from '@snx-v3/useSynthToken';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:useDepositBaseAndromeda');

export const useDepositBaseAndromeda = ({
  accountId,
  newAccountId,
  collateralTypeAddress,
  collateralChange,
  currentCollateral,
  availableCollateral,
  collateralSymbol,
}: {
  accountId?: string;
  newAccountId: string;
  collateralTypeAddress?: string;
  currentCollateral?: Wei;
  availableCollateral?: Wei;
  collateralChange: Wei;
  collateralSymbol?: string;
}) => {
  const [txnState, dispatch] = React.useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();
  const { data: collateralType } = useCollateralType(collateralSymbol);
  const { data: synthToken } = useSynthToken(collateralType);

  const { network } = useNetwork();
  const signer = useSigner();
  const provider = useProvider();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (
        !(
          network &&
          provider &&
          signer &&
          CoreProxy &&
          SpotMarketProxy &&
          collateralTypeAddress &&
          availableCollateral &&
          currentCollateral &&
          synthToken &&
          synthToken.token
        )
      ) {
        return;
      }

      if (collateralChange.eq(0)) return;

      // Steps:
      // 1. Create an account if not exists
      // 2. Wrap USDC or stataUSDC to sUSDC or sStataUSDC
      // 3. Approve sUSDC or sStataUSDC
      // 4. Deposit sUSDC or sStataUSDC
      // 5. Delegate collateral

      dispatch({ type: 'prompting' });
      const walletAddress = await signer.getAddress();
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

      log('collateralChange', collateralChange);
      log('availableCollateral', availableCollateral);

      const synthAmountNeeded = collateralChange
        .sub(availableCollateral)
        // Reduce precision to avoid rounding issues
        .mul(ethers.utils.parseUnits('1', synthToken.token.decimals))
        .div(D18)
        // revert back to 18
        .mul(D18)
        .div(ethers.utils.parseUnits('1', synthToken.token.decimals));
      log('synthAmountNeeded', synthAmountNeeded);

      const tokenAmountToWrap = synthAmountNeeded
        .mul(ethers.utils.parseUnits('1', synthToken.token.decimals))
        .div(D18);
      log('tokenAmountToWrap', tokenAmountToWrap);

      // Wrap
      const wrap = synthAmountNeeded.gt(0)
        ? SpotMarketProxyContract.populateTransaction.wrap(
            synthToken.synthMarketId,
            tokenAmountToWrap.toBN(),
            synthAmountNeeded.toBN()
          )
        : undefined;

      // Synth
      const SynthTokenContract = new ethers.Contract(synthToken.address, approveAbi, signer);

      const synthApproval = synthAmountNeeded.gt(0)
        ? SynthTokenContract.populateTransaction.approve(
            CoreProxy.address,
            synthAmountNeeded.toBN()
          )
        : undefined;

      // optionally deposit if available collateral not enough
      const deposit = synthAmountNeeded.gt(0)
        ? CoreProxyContract.populateTransaction.deposit(
            ethers.BigNumber.from(id),
            synthToken.address,
            synthAmountNeeded.toBN() // only deposit what's needed
          )
        : undefined;

      log('currentCollateral', currentCollateral);
      log('collateralChange', collateralChange);
      log('newDelegation', currentCollateral.add(collateralChange));
      const delegate = CoreProxyContract.populateTransaction.delegateCollateral(
        ethers.BigNumber.from(id),
        ethers.BigNumber.from(POOL_ID),
        synthToken.address,
        currentCollateral.add(collateralChange).toBN(),
        ethers.utils.parseEther('1')
      );

      const callsPromise = Promise.all(
        [wrap, synthApproval, createAccount, deposit, delegate].filter(notNil)
      );

      const [calls] = await Promise.all([callsPromise]);

      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useDepositBaseAndromeda',
        walletAddress
      );

      const txn = await signer.sendTransaction({
        ...erc7412Tx,
        gasLimit: gasLimit.mul(15).div(10),
      });
      log('txn', txn);
      dispatch({ type: 'pending', payload: { txnHash: txn.hash } });

      const receipt = await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);
      return receipt;
    },

    onSuccess: async () => {
      const deployment = `${network?.id}-${network?.preset}`;
      await Promise.all(
        [
          //
          'Accounts',
          'PriceUpdates',
          'LiquidityPosition',
          'LiquidityPositions',
          'TokenBalance',
          'SynthBalances',
          'EthBalance',
          'Allowance',
          'TransferableSynthetix',
        ].map((key) => queryClient.invalidateQueries({ queryKey: [deployment, key] }))
      );
      dispatch({ type: 'success' });
    },

    onError: (error) => {
      dispatch({ type: 'error', payload: { error } });
      throw error;
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
