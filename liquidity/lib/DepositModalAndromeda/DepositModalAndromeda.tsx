import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Flex, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { D18, D6, ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useApprove } from '@snx-v3/useApprove';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePositionManagerForCollateral } from '@snx-v3/usePositionManagerForCollateral';
import { useUSDC } from '@snx-v3/useUSDC';
import { withERC7412 } from '@snx-v3/withERC7412';
import { Wei } from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:DepositModalAndromeda');

export function DepositModalAndromeda({ onClose }: { onClose: () => void }) {
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { collateralChange, setCollateralChange } = React.useContext(ManagePositionContext);

  const toast = useToast({ isClosable: true, duration: 9000 });

  const queryClient = useQueryClient();
  const errorParser = useContractErrorParser();

  const { data: USDC } = useUSDC();
  const { data: AccountProxy } = useAccountProxy();
  const { data: PositionManager } = usePositionManagerForCollateral({ collateralType });

  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const { network } = useNetwork();
  const signer = useSigner();
  const provider = useProvider();

  const {
    approve: approveUSDC,
    requireApproval: requireApprovalUSDC,
    txnState: txnStateApproveUSDC,
    isReady: isReadyApproveUSDC,
  } = useApprove({
    contractAddress: USDC?.address,
    amount: collateralChange.toBN().mul(D6).div(D18),
    spender: PositionManager?.address,
  });

  const isReady =
    network &&
    provider &&
    signer &&
    AccountProxy &&
    PositionManager &&
    USDC?.address &&
    collateralType?.tokenAddress &&
    collateralChange.gt(0) &&
    isReadyApproveUSDC &&
    // Make it boolean
    true;

  const [txnStateDeposit, dispatch] = React.useReducer(reducer, initialState);

  // This caching is necessary to keep initial values after success and not reset them to zeroes
  const [cachedCollateralChange, setCachedCollateralChange] = React.useState<Wei>(collateralChange);

  const { mutate: execDeposit } = useMutation({
    mutationFn: async function () {
      log('params', params);
      log('collateralType', collateralType);

      if (!isReady) {
        throw new Error('Not ready');
      }

      if (requireApprovalUSDC) {
        await approveUSDC(false);
      }

      dispatch({ type: 'prompting' });

      const walletAddress = await signer.getAddress();

      const callsPromises = [];

      if (params.accountId) {
        const AccountProxyContract = new ethers.Contract(
          AccountProxy.address,
          AccountProxy.abi,
          signer
        );
        const approveAccountTx = AccountProxyContract.populateTransaction.approve(
          PositionManager.address,
          params.accountId
        );
        callsPromises.push(approveAccountTx);
      }

      const PositionManagerContract = new ethers.Contract(
        PositionManager.address,
        PositionManager.abi,
        signer
      );

      if (params.accountId) {
        const increasePositionTx = PositionManagerContract.populateTransaction.increasePosition(
          params.accountId,
          collateralChange.toBN().mul(D6).div(D18)
        );
        callsPromises.push(increasePositionTx);
      } else {
        const setupPositionTx = PositionManagerContract.populateTransaction.setupPosition(
          collateralChange.toBN().mul(D6).div(D18)
        );
        callsPromises.push(setupPositionTx);
      }

      const calls = await Promise.all(callsPromises);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useDepositAndromeda',
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
        ].map((key) => queryClient.invalidateQueries({ queryKey: [deployment, key] }))
      );

      toast.closeAll();
      toast({
        title: 'Success',
        description: 'Your locked collateral amount has been updated.',
        status: 'success',
        duration: 5000,
        variant: 'left-accent',
      });

      setCollateralChange(ZEROWEI);
      dispatch({ type: 'success' });
    },

    onError: (error) => {
      dispatch({ type: 'error', payload: { error } });

      const contractError = errorParser(error);
      if (contractError) {
        console.error(new Error(contractError.name), contractError);
      }
      toast.closeAll();
      toast({
        title: 'Transaction failed',
        variant: 'left-accent',
        description: contractError ? (
          <ContractError contractError={contractError} />
        ) : (
          'Please try again.'
        ),
        status: 'error',
        duration: 3_600_000,
      });
      throw Error('Transaction failed', { cause: error });
    },
  });

  return (
    <Flex flexDirection="column" data-cy="deposit multistep">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon
          cursor="pointer"
          onClick={() => {
            dispatch({ type: 'settled' });
            setCachedCollateralChange(collateralChange);
            onClose();
          }}
          mr={2}
        />
        {params.accountId ? <>Manage Collateral</> : <>Open Liquidity Position</>}
      </Text>
      <Divider my={4} />
      <Multistep
        step={1}
        title="Approve USDC"
        subtitle={
          <>
            <Amount
              prefix="Approve spending of "
              value={cachedCollateralChange}
              suffix={` USDC.`}
            />
          </>
        }
        status={{
          failed: txnStateApproveUSDC.txnStatus === 'error',
          success: txnStateApproveUSDC.txnStatus === 'success',
          loading:
            txnStateApproveUSDC.txnStatus === 'prompting' ||
            txnStateApproveUSDC.txnStatus === 'pending',
        }}
      />
      <Multistep
        step={2}
        title="Deposit and Lock USDC"
        subtitle={
          <>
            {!params.accountId ? <Text>Create new account</Text> : null}
            {params.accountId ? <Text>Approve update position on behalf</Text> : null}
            <Amount prefix="Deposit and lock " value={cachedCollateralChange} suffix={` USDC.`} />
          </>
        }
        status={{
          failed: txnStateDeposit.txnStatus === 'error',
          success: txnStateDeposit.txnStatus === 'success',
          loading:
            txnStateDeposit.txnStatus === 'prompting' || txnStateDeposit.txnStatus === 'pending',
        }}
      />

      {txnStateDeposit.txnStatus === 'success' ? (
        <Button
          onClick={() => {
            dispatch({ type: 'settled' });
            setCachedCollateralChange(collateralChange);
            onClose();
          }}
          mt="6"
        >
          Done
        </Button>
      ) : (
        <Button
          data-cy="deposit confirm button"
          isLoading={
            txnStateApproveUSDC.txnStatus === 'prompting' ||
            txnStateApproveUSDC.txnStatus === 'pending' ||
            txnStateDeposit.txnStatus === 'prompting' ||
            txnStateDeposit.txnStatus === 'pending'
          }
          isDisabled={true}
          onClick={() => {
            window?._paq?.push([
              'trackEvent',
              'liquidity',
              'v3_staking',
              `submit_deposit_${collateralType?.symbol?.toLowerCase()}_v3`,
            ]);
            execDeposit();
          }}
          mt="6"
        >
          {(() => {
            if (
              txnStateApproveUSDC.txnStatus === 'unsent' &&
              txnStateDeposit.txnStatus === 'unsent'
            ) {
              return 'Execute Transaction';
            }
            if (
              txnStateApproveUSDC.txnStatus === 'error' ||
              txnStateDeposit.txnStatus === 'error'
            ) {
              return 'Retry';
            }
            if (
              txnStateApproveUSDC.txnStatus === 'prompting' ||
              txnStateApproveUSDC.txnStatus === 'pending' ||
              txnStateDeposit.txnStatus === 'prompting' ||
              txnStateDeposit.txnStatus === 'pending'
            ) {
              return 'Processing...';
            }
            return 'Execute Transaction';
          })()}
        </Button>
      )}
    </Flex>
  );
}
