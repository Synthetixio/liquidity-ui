import { Box, Button, Flex, Text, useToast } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { ContractError } from '@snx-v3/ContractError';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { useNetwork, useProvider, useSigner, useWallet } from '@snx-v3/useBlockchain';
import { useContractErrorParser } from '@snx-v3/useContractErrorParser';
import { useLegacyMarket } from '@snx-v3/useLegacyMarket';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useUSDProxy } from '@snx-v3/useUSDProxy';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';
import React from 'react';

const log = debug('snx:SUSD');

export function SUSD() {
  const { network } = useNetwork();
  const provider = useProvider();
  const signer = useSigner();
  const { activeWallet } = useWallet();
  const walletAddress = activeWallet?.address;

  const { data: LegacyMarket } = useLegacyMarket();
  const { data: USDProxy } = useUSDProxy();

  const { data: systemTokenBalance } = useTokenBalance(USDProxy?.address);

  const toast = useToast({ isClosable: true, duration: 9000 });
  const queryClient = useQueryClient();
  const errorParser = useContractErrorParser();
  const isReady =
    network &&
    provider &&
    signer &&
    walletAddress &&
    LegacyMarket &&
    USDProxy &&
    // Boolean
    true;

  const { mutateAsync: unwrapSUSD, isPending } = useMutation({
    mutationFn: async function () {
      if (!isReady) {
        throw new Error('Not ready');
      }

      const USDProxyContract = new ethers.Contract(USDProxy.address, USDProxy.abi, signer);
      const balanceOfV3USD = await USDProxyContract.balanceOf(walletAddress);
      log('balanceOfV3USD', balanceOfV3USD);

      const alowanceOfV3USD = await USDProxyContract.allowance(walletAddress, LegacyMarket.address);
      log('alowanceOfV3USD', alowanceOfV3USD);

      if (balanceOfV3USD.gt(alowanceOfV3USD)) {
        toast.closeAll();
        toast({ title: 'Approving snxUSD...', variant: 'left-accent' });
        const approveV3USDGasLimit = await USDProxyContract.estimateGas.approve(
          LegacyMarket.address,
          balanceOfV3USD
        );
        log('approve snxUSD gasLimit', approveV3USDGasLimit);
        const txn = await USDProxyContract.approve(LegacyMarket.address, balanceOfV3USD, {
          gasLimit: approveV3USDGasLimit.mul(15).div(10),
        });
        log('approve snxUSD txn', txn);
        const receipt = await provider.waitForTransaction(txn.hash);
        log('approve snxUSD receipt', receipt);
      }

      const LegacyMarketContract = new ethers.Contract(
        LegacyMarket.address,
        LegacyMarket.abi,
        signer
      );
      const gasLimit = await LegacyMarketContract.estimateGas.returnUSD(balanceOfV3USD);
      const txn = await LegacyMarketContract.returnUSD(balanceOfV3USD, {
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
          'TokenBalance',
        ].map((key) => queryClient.invalidateQueries({ queryKey: [deployment, key] }))
      );

      toast.closeAll();
      toast({
        title: 'Success',
        description: 'Your sUSD has been redeemed.',
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

  if (!(systemTokenBalance && systemTokenBalance.gt(0))) {
    return null;
  }

  return (
    <Box mt={6}>
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" textDecoration="none" _hover={{ textDecoration: 'none' }}>
          <TokenIcon height={30} width={30} symbol="SUSD" />
          <Flex flexDirection="column" ml={3}>
            <Text
              color="white"
              fontWeight={700}
              lineHeight="1.25rem"
              fontFamily="heading"
              fontSize="sm"
            >
              sUSD
            </Text>
          </Flex>
        </Flex>
        <Flex direction="column" alignItems="flex-end">
          <Text
            color="green.500"
            fontSize="14px"
            fontFamily="heading"
            fontWeight={500}
            lineHeight="20px"
          >
            <Amount prefix="$" value={systemTokenBalance} />
          </Text>
        </Flex>
        <Button
          size="sm"
          variant="solid"
          isDisabled={!isReady}
          isLoading={isPending}
          _disabled={{
            bg: 'gray.900',
            backgroundImage: 'none',
            color: 'gray.500',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
          data-cy="unwrap stata submit"
          onClick={() => {
            window?._paq?.push(['trackEvent', 'liquidity', 'v3_staking', `submit_redeem_susd`]);
            unwrapSUSD();
          }}
        >
          Redeem
        </Button>
      </Flex>
    </Box>
  );
}
