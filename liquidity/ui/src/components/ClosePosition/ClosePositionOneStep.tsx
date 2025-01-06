import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Flex, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { POOL_ID, ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { Multistep } from '@snx-v3/Multistep';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useClosePosition } from '@snx-v3/useClosePosition';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePythFeeds } from '@snx-v3/usePythFeeds';
import { usePythVerifier } from '@snx-v3/usePythVerifier';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTrustedMulticallForwarder } from '@snx-v3/useTrustedMulticallForwarder';
import { withERC7412 } from '@snx-v3/withERC7412';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';
import { LiquidityPositionUpdated } from '../Manage/LiquidityPositionUpdated';

const log = debug('snx:ClosePositionOneStep');

export function ClosePositionOneStep({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition, refetch: refetchLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { setCollateralChange, setDebtChange } = React.useContext(ManagePositionContext);
  const toast = useToast({ isClosable: true, duration: 9000 });

  const [txState, setTxState] = React.useState({ step: 0, status: 'idle' });

  const queryClient = useQueryClient();
  const errorParser = useContractErrorParser();

  const { data: CoreProxy } = useCoreProxy();
  const { data: Multicall3 } = useTrustedMulticallForwarder();
  const { data: AccountProxy } = useAccountProxy();
  const { data: ClosePosition } = useClosePosition();
  const { data: PythVerfier } = usePythVerifier();
  const { data: pythFeeds } = usePythFeeds();
  const { data: systemToken } = useSystemToken();

  const { data: priceUpdateTx } = useCollateralPriceUpdates();

  const { network } = useNetwork();
  const signer = useSigner();
  const provider = useProvider();

  // const queryClient = useQueryClient();
  // queryClient.invalidateQueries();

  const { mutate: execClosePosition } = useMutation({
    mutationFn: async function () {
      log('params', params);
      log('collateralType', collateralType);

      setTxState({ step: 1, status: 'pending' });
      if (
        !(
          network &&
          provider &&
          signer &&
          CoreProxy &&
          Multicall3 &&
          AccountProxy &&
          ClosePosition &&
          PythVerfier &&
          pythFeeds &&
          params.accountId &&
          systemToken?.address &&
          collateralType?.tokenAddress
        )
      ) {
        throw new Error('Not ready');
      }

      const ClosePositionContract = new ethers.Contract(
        ClosePosition.address,
        ClosePosition.abi,
        signer
      );
      const AccountProxyContract = new ethers.Contract(
        AccountProxy.address,
        AccountProxy.abi,
        signer
      );
      const TokenContract = new ethers.Contract(
        systemToken?.address,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );

      const { data: freshLiquidityPosition } = await refetchLiquidityPosition({
        throwOnError: true,
      });
      if (!freshLiquidityPosition) {
        throw new Error('Could not fetch fresh liquidity position');
      }
      const adjustedAllowance = freshLiquidityPosition.debt.lt(1)
        ? // For the case when debt fluctuates from negative/zero to slightly positive
          ethers.utils.parseEther('1')
        : // Add extra buffer for debt fluctuations
          freshLiquidityPosition.debt.mul(120).div(100).toBN();
      log('adjustedAllowance', adjustedAllowance);

      const approveAccountTx = AccountProxyContract.populateTransaction.approve(
        ClosePosition.address,
        params.accountId
      );
      const approveUsdTx = TokenContract.populateTransaction.approve(
        ClosePosition.address,
        adjustedAllowance
      );
      const closePositionTx = ClosePositionContract.populateTransaction.closePosition(
        CoreProxy.address,
        AccountProxy.address,
        params.accountId,
        POOL_ID,
        collateralType.tokenAddress
      );
      const callsPromise = Promise.all([approveAccountTx, approveUsdTx, closePositionTx]);
      const [calls] = await Promise.all([callsPromise]);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const walletAddress = await signer.getAddress();
      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'useClosePosition',
        walletAddress
      );

      const txn = await signer.sendTransaction({
        ...erc7412Tx,
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

      setCollateralChange(ZEROWEI);
      setDebtChange(ZEROWEI);
      setTxState({ step: 1, status: 'success' });
    },

    onError: (error) => {
      setTxState({ step: 1, status: 'error' });
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

  if (txState.status === 'success') {
    return (
      <LiquidityPositionUpdated
        onClose={onClose}
        title="Position successfully Closed"
        subline={
          <>
            Your position has been successfully closed, read more about it in the{' '}
            <Link
              href="https://docs.synthetix.io/v/synthetix-v3-user-documentation"
              target="_blank"
              color="cyan.500"
            >
              Synthetix V3 Documentation
            </Link>
          </>
        }
        alertText={<>Position successfully Closed</>}
      />
    );
  }

  return (
    <Flex flexDirection="column" data-cy="close position multistep">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon cursor="pointer" onClick={onBack} mr={2} />
        Close Position
      </Text>
      <Divider mt={6} bg="gray.900" />
      <Multistep
        step={1}
        title="Close position"
        subtitle={
          <>
            <Text>Approve close position on behalf</Text>
            {liquidityPosition && liquidityPosition.debt && liquidityPosition.debt.gt(0) ? (
              <Text>
                <Amount
                  prefix="Repay "
                  value={liquidityPosition.debt}
                  suffix={` ${systemToken ? systemToken.symbol : ''} of debt`}
                />
              </Text>
            ) : null}
            {liquidityPosition && liquidityPosition.debt && liquidityPosition.debt.lt(0) ? (
              <Text>
                <Amount
                  prefix="Claim "
                  value={liquidityPosition.debt.abs()}
                  suffix={` ${systemToken ? systemToken.symbol : ''}`}
                />
              </Text>
            ) : null}
            {liquidityPosition ? (
              <Amount
                prefix="Unlock "
                value={liquidityPosition.collateralAmount}
                suffix={` ${collateralType ? collateralType.symbol : ''} from the pool`}
              />
            ) : null}
          </>
        }
        status={{
          failed: txState.status === 'error',
          success: txState.status === 'success',
          loading: txState.status === 'pending',
        }}
      />
      <Button
        data-cy="close position confirm button"
        isLoading={txState.status === 'pending'}
        isDisabled={!(liquidityPosition && liquidityPosition.collateralAmount.gt(0))}
        onClick={() => execClosePosition()}
        mt="6"
      >
        {txState.status === 'error' ? 'Retry' : null}
        {txState.status === 'pending' ? 'Processing...' : null}
        {txState.status === 'idle' ? 'Execute Transaction' : null}
      </Button>
    </Flex>
  );
}
