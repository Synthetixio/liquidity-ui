import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Flex, Link, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ZEROWEI } from '@snx-v3/constants';
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
import { formatGasPriceForTransaction } from '@snx-v3/useGasOptions';
import { getGasPrice } from '@snx-v3/useGasPrice';
import { useGasSpeed } from '@snx-v3/useGasSpeed';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useParams } from '@snx-v3/useParams';
import { usePythFeeds } from '@snx-v3/usePythFeeds';
import { usePythVerifier } from '@snx-v3/usePythVerifier';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { withERC7412 } from '@snx-v3/withERC7412';
import { wei } from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';
import { LiquidityPositionUpdated } from '../Manage/LiquidityPositionUpdated';
import { useAccountCollateral } from './useAccountCollateral';
import { usePositionDebt } from './usePositionDebt';

const log = debug('snx:ClosePositionOneStep');

export function ClosePositionOneStep({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
  const params = useParams();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { setCollateralChange, setDebtChange } = React.useContext(ManagePositionContext);
  const toast = useToast({ isClosable: true, duration: 9000 });

  const [txState, setTxState] = React.useState({ step: 0, status: 'idle' });

  const queryClient = useQueryClient();
  const errorParser = useContractErrorParser();

  const { data: CoreProxy } = useCoreProxy();
  const { data: Multicall3 } = useMulticall3();
  const { data: AccountProxy } = useAccountProxy();
  const { data: ClosePosition } = useClosePosition();
  const { data: PythVerfier } = usePythVerifier();
  const { data: pythFeeds } = usePythFeeds();
  const { data: systemToken } = useSystemToken();

  const { data: priceUpdateTx, refetch: refetchPriceUpdateTx } = useCollateralPriceUpdates();

  const { gasSpeed } = useGasSpeed();
  const { network } = useNetwork();
  const signer = useSigner();
  const provider = useProvider();

  const { data: positionDebt } = usePositionDebt({
    provider,
    accountId: params.accountId,
    poolId: params.poolId,
    collateralTypeTokenAddress: collateralType?.tokenAddress,
  });

  const { data: accountCollateral } = useAccountCollateral({
    provider,
    accountId: params.accountId,
    collateralTypeTokenAddress: collateralType?.tokenAddress,
  });

  const { mutate: execClosePosition } = useMutation({
    mutationFn: async function () {
      log('params: %O', params);
      log('collateralType: %O', collateralType);
      log('accountCollateral: %O', accountCollateral);
      log('positionDebt: %O', positionDebt);

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
          params.poolId &&
          params.accountId &&
          systemToken?.address &&
          collateralType?.tokenAddress &&
          positionDebt
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

      const adjustedAllowance = positionDebt.lt(1)
        ? // For the case when debt fluctuates from negative/zero to slightly positive
          ethers.utils.parseEther('1.00')
        : // Add extra buffer for debt fluctuations
          positionDebt.mul(150).div(100);
      log('adjustedAllowance: %O', adjustedAllowance);

      // "function approve(address to, uint256 tokenId)",

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
        params.poolId,
        collateralType.tokenAddress
      );
      const callsPromise = Promise.all([approveAccountTx, approveUsdTx, closePositionTx]);
      const [calls, gasPrices] = await Promise.all([callsPromise, getGasPrice({ provider })]);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const walletAddress = await signer.getAddress();
      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        network,
        calls,
        'useClosePosition',
        walletAddress
      );

      const gasOptionsForTransaction = formatGasPriceForTransaction({
        gasLimit,
        gasPrices,
        gasSpeed,
      });

      const txn = await signer.sendTransaction({ ...erc7412Tx, ...gasOptionsForTransaction });
      console.log('[closePosition] txn hash', txn.hash); // eslint-disable-line no-console
      log('txn %O', txn);
      const receipt = await txn.wait();
      log('receipt %O', receipt);
    },

    onSuccess: async () => {
      setTxState({ step: 1, status: 'success' });
      setCollateralChange(ZEROWEI);
      setDebtChange(ZEROWEI);

      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPosition'],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'LiquidityPositions'],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'Allowance'],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'AccountSpecificCollateral'],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'TokenBalance'],
      });
      queryClient.invalidateQueries({
        queryKey: [`${network?.id}-${network?.preset}`, 'AccountCollateralUnlockDate'],
      });

      // After mutation withERC7412, we guaranteed to have updated all the prices, dont care about await
      refetchPriceUpdateTx();
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
      <Text color="gray.50" fontSize="sm" fontWeight="700">
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
            {positionDebt && positionDebt.gt(0) ? (
              <Text>
                <Amount
                  prefix="Repay "
                  value={wei(positionDebt)}
                  suffix={` ${systemToken ? systemToken.symbol : ''} of debt`}
                />
              </Text>
            ) : null}
            {positionDebt && positionDebt.lt(0) ? (
              <Text>
                <Amount
                  prefix="Claim "
                  value={wei(positionDebt.abs())}
                  suffix={` ${systemToken ? systemToken.symbol : ''}`}
                />
              </Text>
            ) : null}
            <Amount
              prefix="Unlock "
              value={accountCollateral ? wei(accountCollateral.totalAssigned) : ZEROWEI}
              suffix={` ${collateralType ? collateralType.symbol : ''} from the pool`}
            />
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
        isDisabled={!(accountCollateral && accountCollateral.totalAssigned.gt(0))}
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
