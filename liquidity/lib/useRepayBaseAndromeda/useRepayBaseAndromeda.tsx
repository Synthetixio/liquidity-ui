import { POOL_ID } from '@snx-v3/constants';
import { parseUnits } from '@snx-v3/format';
import { getSpotMarketId } from '@snx-v3/isBaseAndromeda';
import { notNil } from '@snx-v3/tsHelpers';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { approveAbi } from '@snx-v3/useApprove';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useGetUSDTokens } from '@snx-v3/useGetUSDTokens';
import { useSpotMarketProxy } from '@snx-v3/useSpotMarketProxy';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { withERC7412 } from '@snx-v3/withERC7412';
import Wei from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { BigNumber, ethers } from 'ethers';
import { useReducer } from 'react';

const log = debug('snx:useRepayBaseAndromeda');

export const useRepayBaseAndromeda = ({
  accountId,
  collateralTypeAddress,
  debtChange,
  availableUSDCollateral,
  collateralSymbol,
}: {
  accountId?: string;
  collateralTypeAddress?: string;
  availableUSDCollateral?: Wei;
  debtChange: Wei;
  collateralSymbol?: string;
}) => {
  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: CoreProxy } = useCoreProxy();
  const { data: systemToken } = useSystemToken();
  const { data: SpotMarketProxy } = useSpotMarketProxy();
  const { data: priceUpdateTx } = useCollateralPriceUpdates();
  const { data: usdTokens } = useGetUSDTokens();

  const signer = useSigner();
  const { network } = useNetwork();
  const provider = useProvider();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!signer || !network || !provider) throw new Error('No signer or network');

      if (
        !(
          CoreProxy &&
          accountId &&
          collateralTypeAddress &&
          systemToken &&
          SpotMarketProxy &&
          usdTokens?.sUSD
        )
      ) {
        return;
      }

      if (!availableUSDCollateral) return;
      if (debtChange.eq(0)) return;
      const debtChangeAbs = debtChange.abs();
      const amountToDeposit = debtChangeAbs.sub(availableUSDCollateral);
      const collateralAmount = amountToDeposit.gt(0)
        ? parseUnits(amountToDeposit.toString(), 6)
        : BigNumber.from(0);

      dispatch({ type: 'prompting' });

      const spotMarketId = getSpotMarketId(collateralSymbol);

      const SpotMarketProxyContract = new ethers.Contract(
        SpotMarketProxy.address,
        SpotMarketProxy.abi,
        signer
      );

      // USDC or stataUSDC to sUSDC or sStataUSDC
      const wrap = collateralAmount.gt(0)
        ? SpotMarketProxyContract.populateTransaction.wrap(spotMarketId, collateralAmount, 0)
        : undefined;

      const Synth_Contract = new ethers.Contract(collateralTypeAddress, approveAbi, signer);
      const synth_approval = amountToDeposit.gt(0)
        ? Synth_Contract.populateTransaction.approve(
            SpotMarketProxy.address,
            amountToDeposit.toBN()
          )
        : undefined;

      // sUSDC or sStataUSDC => snxUSD
      const sell_synth = amountToDeposit.gt(0)
        ? SpotMarketProxyContract.populateTransaction.sell(
            spotMarketId,
            amountToDeposit.toBN(),
            0,
            ethers.constants.AddressZero
          )
        : undefined;

      // approve sUSD to Core
      const SystemTokenContract = new ethers.Contract(systemToken.address, approveAbi, signer);
      const sUSD_Approval = amountToDeposit.gt(0)
        ? SystemTokenContract.populateTransaction.approve(CoreProxy.address, amountToDeposit.toBN())
        : undefined;

      const CoreProxyContract = new ethers.Contract(CoreProxy.address, CoreProxy.abi, signer);

      // Only deposit if user doesn't have enough sUSD collateral
      const deposit = amountToDeposit.lte(0)
        ? undefined
        : CoreProxyContract.populateTransaction.deposit(
            BigNumber.from(accountId),
            systemToken.address,
            amountToDeposit.toBN() // only deposit what's needed
          );

      const burn = CoreProxyContract.populateTransaction.burnUsd(
        BigNumber.from(accountId),
        BigNumber.from(POOL_ID),
        collateralTypeAddress,
        debtChangeAbs.toBN()
      );

      const callsPromise = Promise.all(
        [wrap, synth_approval, sell_synth, sUSD_Approval, deposit, burn].filter(notNil)
      );

      const [calls] = await Promise.all([callsPromise]);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const walletAddress = await signer.getAddress();
      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useRepay',
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
          'PriceUpdates',
          'LiquidityPosition',
          'LiquidityPositions',
          'TokenBalance',
          'SynthBalances',
          'EthBalance',
          'Allowance',
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
