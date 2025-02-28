import { useToast } from '@chakra-ui/react';
import { ContractError } from '@snx-v3/ContractError';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useLegacyMarket } from '@snx-v3/useLegacyMarket';
import { usePositionManagerNewPool } from '@snx-v3/usePositionManagerNewPool';
import { useTreasuryMarketProxy } from '@snx-v3/useTreasuryMarketProxy';
import { useTrustedMulticallForwarder } from '@snx-v3/useTrustedMulticallForwarder';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';
import { useTargetCRatio } from './useTargetCRatio';
import { useV2xPosition } from './useV2xPosition';

const log = debug('snx:useMigrateNewPoolV2x');

export function useMigrateNewPoolV2x() {
  const signer = useSigner();
  const provider = useProvider();
  const { network } = useNetwork();

  const { data: v2xPosition } = useV2xPosition();

  const { data: PositionManagerNewPool } = usePositionManagerNewPool();
  const { data: LegacyMarket } = useLegacyMarket();
  const { data: TreasuryMarketProxy } = useTreasuryMarketProxy();
  const { data: TrustedMulticallForwarder } = useTrustedMulticallForwarder();
  const { data: targetCRatio } = useTargetCRatio();

  const isReady =
    network &&
    provider &&
    signer &&
    TrustedMulticallForwarder &&
    PositionManagerNewPool &&
    TreasuryMarketProxy &&
    LegacyMarket &&
    targetCRatio &&
    v2xPosition &&
    v2xPosition.collateralAmount.gt(0) &&
    (v2xPosition.cRatio.lte(0) || v2xPosition.cRatio.gte(targetCRatio)) &&
    true;

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!isReady) {
        throw new Error('Not ready');
      }

      toast.closeAll();
      toast({ title: 'Migrating...', variant: 'left-accent' });

      const accountId = `${1_000_000_000_000 + Math.floor(Math.random() * 1_000_000_000_000)}`;

      const LegacyMarketProxyInterface = new ethers.utils.Interface(LegacyMarket.abi);
      const TreasuryMarketProxyInterface = new ethers.utils.Interface(TreasuryMarketProxy.abi);
      const multicall = [
        {
          target: TreasuryMarketProxy.address,
          callData: TreasuryMarketProxyInterface.encodeFunctionData('rebalance'),
          requireSuccess: true,
        },
        {
          target: LegacyMarket.address,
          callData: LegacyMarketProxyInterface.encodeFunctionData('migrate', [
            ethers.BigNumber.from(accountId),
          ]),
          requireSuccess: true,
        },
        {
          target: TreasuryMarketProxy.address,
          callData: TreasuryMarketProxyInterface.encodeFunctionData('saddle', [
            ethers.BigNumber.from(accountId),
          ]),
          requireSuccess: true,
        },
      ];
      log('multicall', multicall);

      const TrustedMulticallForwarderContract = new ethers.Contract(
        TrustedMulticallForwarder.address,
        TrustedMulticallForwarder.abi,
        signer
      );
      const populatedTxn =
        await TrustedMulticallForwarderContract.populateTransaction.aggregate3(multicall);
      const gasLimit = await provider.estimateGas(populatedTxn);
      log('gasLimit', gasLimit);
      const txn = await TrustedMulticallForwarderContract.aggregate3(multicall, {
        gasLimit: gasLimit.mul(15).div(10),
      });
      log('txn', txn);
      const receipt = await provider.waitForTransaction(txn.hash);
      log('receipt', receipt);

      return receipt;
    },

    onSuccess: async () => {
      const deployment = `${network?.id}-${network?.preset}`;
      await Promise.all(
        [
          //
          'New Pool',
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
          'AccountCollateralUnlockDate',
        ].map((key) => queryClient.invalidateQueries({ queryKey: [deployment, key] }))
      );

      toast.closeAll();
      toast({
        title: 'Success',
        description: 'Migration completed.',
        status: 'success',
        duration: 5000,
        variant: 'left-accent',
      });
    },

    onError: (error) => {
      const contractError = errorParser(error);
      if (contractError) {
        console.error(new Error(contractError.name), contractError);
      }
      toast.closeAll();
      toast({
        title: 'Could not complete migration',
        description: contractError ? (
          <ContractError contractError={contractError} />
        ) : (
          'Please try again.'
        ),
        status: 'error',
        variant: 'left-accent',
        duration: 3_600_000,
      });
      throw Error('Migration failed', { cause: error });
    },
  });

  return {
    isReady,
    mutation,
  };
}
