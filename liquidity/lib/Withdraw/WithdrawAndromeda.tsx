import { Alert, AlertIcon, Button, Collapse, Flex, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { ContractError } from '@snx-v3/ContractError';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { initialState, reducer } from '@snx-v3/txnReducer';
import { useAccountCollateralUnlockDate } from '@snx-v3/useAccountCollateralUnlockDate';
import { useAccountProxy } from '@snx-v3/useAccountProxy';
import { useNetwork, useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCollateralPriceUpdates } from '@snx-v3/useCollateralPriceUpdates';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePositionManagerForCollateral } from '@snx-v3/usePositionManagerForCollateral';
import { useWithdrawTimer } from '@snx-v3/useWithdrawTimer';
import { withERC7412 } from '@snx-v3/withERC7412';
import { wei } from '@synthetixio/wei';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React, { useReducer } from 'react';
import { WithdrawModalAndromeda } from './WithdrawModalAndromeda';

const log = debug('snx:WithdrawAndromeda');

export function WithdrawAndromeda() {
  const [params] = useParams<PositionPageSchemaType>();
  const { setWithdrawAmount } = React.useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: accountCollateralUnlockDate, isLoading: isLoadingDate } =
    useAccountCollateralUnlockDate({ accountId: params.accountId });

  const symbol = 'USDC';
  const { minutes, hours, isRunning } = useWithdrawTimer(params.accountId);
  const unlockDate = !isLoadingDate ? accountCollateralUnlockDate : null;

  const maxWithdrawable = React.useMemo(() => {
    if (liquidityPosition) {
      return liquidityPosition.availableCollateral
        .mul(liquidityPosition.collateralPrice)
        .add(liquidityPosition.availableSystemToken);
    }
  }, [liquidityPosition]);

  React.useEffect(() => {
    if (maxWithdrawable && maxWithdrawable.gt(0)) {
      setWithdrawAmount(maxWithdrawable.abs());
    }
  }, [maxWithdrawable, setWithdrawAmount]);

  const [txnState, dispatch] = useReducer(reducer, initialState);
  const { data: priceUpdateTx } = useCollateralPriceUpdates();
  const { network } = useNetwork();
  const signer = useSigner();
  const provider = useProvider();

  const { data: AccountProxy } = useAccountProxy();
  const { data: PositionManager } = usePositionManagerForCollateral({ collateralType });

  const isReady =
    signer &&
    network &&
    provider &&
    AccountProxy &&
    PositionManager &&
    // Make it Boolean
    true;

  const queryClient = useQueryClient();
  const withdraw = useMutation({
    mutationFn: async function () {
      log('params', params);
      log('collateralType', collateralType);

      if (!isReady) {
        throw new Error('Not ready');
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

      const withdrawTx = PositionManagerContract.populateTransaction.withdraw(params.accountId);
      callsPromises.push(withdrawTx);

      const calls = await Promise.all(callsPromises);
      if (priceUpdateTx) {
        calls.unshift(priceUpdateTx as any);
      }

      const { multicallTxn: erc7412Tx, gasLimit } = await withERC7412(
        provider,
        network,
        calls,
        'WithdrawAndromeda',
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

  const toast = useToast({ isClosable: true, duration: 9000 });
  const errorParser = useContractErrorParser();
  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        toast.closeAll();
        toast({ title: 'Withdrawing...', variant: 'left-accent' });

        await withdraw.mutateAsync();
        setWithdrawAmount(ZEROWEI);

        toast.closeAll();
        toast({
          title: 'Success',
          description: 'Withdrawal was successful',
          status: 'success',
          duration: 5000,
          variant: 'left-accent',
        });
      } catch (error: any) {
        const contractError = errorParser(error);
        if (contractError) {
          console.error(new Error(contractError.name), contractError);
        }
        toast.closeAll();
        toast({
          title: 'Could not complete withdrawing',
          description: contractError ? (
            <ContractError contractError={contractError} />
          ) : (
            'Please try again.'
          ),
          status: 'error',
          variant: 'left-accent',
          duration: 3_600_000,
        });
      }
    },
    [errorParser, setWithdrawAmount, toast, withdraw]
  );

  return (
    <Flex flexDirection="column" data-cy="withdraw form" as="form" onSubmit={onSubmit}>
      <WithdrawModalAndromeda txnStatus={txnState.txnStatus} txnHash={txnState.txnHash} />
      <Text color="gray./50" fontSize="sm" fontWeight="700" mb="3">
        Withdraw Collateral
      </Text>
      <BorderBox display="flex" p={3} mb="6">
        <Flex alignItems="flex-start" flexDir="column" gap="1">
          <BorderBox display="flex" py={1.5} px={2.5}>
            <Text
              display="flex"
              gap={2}
              fontSize="16px"
              alignItems="center"
              fontWeight="600"
              whiteSpace="nowrap"
            >
              <TokenIcon symbol={symbol} width={16} height={16} />
              {symbol}
            </Text>
          </BorderBox>
          <Text fontSize="12px" whiteSpace="nowrap" data-cy="withdraw amount">
            {isPendingLiquidityPosition ? 'Unlocked: ~' : null}
            {maxWithdrawable ? (
              <Amount prefix="Unlocked: " value={maxWithdrawable} suffix={` ${symbol}`} />
            ) : null}
          </Text>
        </Flex>
        <Flex flexDir="column" flexGrow={1}>
          <NumberInput
            InputProps={{
              isRequired: true,
              'data-cy': 'withdraw amount input',
              type: 'number',
              min: 0,
            }}
            value={
              maxWithdrawable ? wei(parseFloat(maxWithdrawable.toString()).toFixed(2)) : ZEROWEI
            }
            disabled
          />
          <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
            {isPendingLiquidityPosition ? '~' : null}
            {!isPendingLiquidityPosition && maxWithdrawable ? (
              <Amount prefix="$" value={maxWithdrawable ? maxWithdrawable : ZEROWEI} />
            ) : null}
          </Flex>
        </Flex>
      </BorderBox>

      <Collapse
        in={maxWithdrawable && maxWithdrawable.gt(0) && isRunning}
        animateOpacity
        unmountOnExit
      >
        <Alert status="warning" mb="6" borderRadius="6px">
          <AlertIcon />
          <Text>
            You will be able to withdraw assets in {hours}H{minutes}M. Any account activity will
            reset this timer to 24H.
          </Text>
        </Alert>
      </Collapse>

      <Collapse
        in={maxWithdrawable && maxWithdrawable.gt(0) && !isRunning}
        animateOpacity
        unmountOnExit
      >
        <Alert status="success" mb="6" borderRadius="6px">
          <AlertIcon />
          <Amount prefix="You can now withdraw " value={maxWithdrawable} suffix={` ${symbol}`} />
        </Alert>
      </Collapse>

      <Button
        isDisabled={
          !isReady || isRunning || !unlockDate || !(maxWithdrawable && maxWithdrawable.gt(0))
        }
        data-cy="withdraw submit"
        type="submit"
        onClick={() => {
          window?._paq?.push([
            'trackEvent',
            'liquidity',
            'v3_staking',
            `submit_withdraw_${collateralType?.symbol?.toLowerCase()}_v3`,
          ]);
        }}
      >
        Withdraw
      </Button>
    </Flex>
  );
}
