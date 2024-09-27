import { Button, Text, useToast, VStack } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { Multistep } from '@snx-v3/Multistep';
import { utils } from 'ethers';
import { useApprove } from '@snx-v3/useApprove';
import { Wei } from '@synthetixio/wei';
import { FC, useCallback, useState, useEffect } from 'react';
import { Network } from '@snx-v3/useBlockchain';
import { StepSuccess } from './StepSuccess';
import { ZEROWEI } from '@snx-v3/constants';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useCollateralTypes } from '@snx-v3/useCollateralTypes';
import { useGetWrapperToken } from '@snx-v3/useGetUSDTokens';
import {
  getSpotMarketId,
  getStataUSDCOnBase,
  getUSDCOnBase,
  isBaseAndromeda,
} from '@snx-v3/isBaseAndromeda';
import { useConvertStataUSDC } from '@snx-v3/useConvertStataUSDC';

type Props = FC<{
  amount: Wei;
  network: Network;
  onSuccess: () => void;
  onBack: () => void;
}>;

export const ConvertStataUSDCTransaction: Props = ({ onSuccess, amount, network, onBack }) => {
  const isBase = isBaseAndromeda(network?.id, network?.preset);

  const { data: collateralTypes } = useCollateralTypes();
  const USDCCollateral = collateralTypes?.filter(
    (collateral) =>
      collateral.tokenAddress.toLowerCase() === getUSDCOnBase(network.id).toLowerCase()
  );
  const USDC = USDCCollateral?.length ? USDCCollateral[0] : undefined;
  const stataUSDCCollateral = collateralTypes?.filter(
    (collateral) =>
      collateral.tokenAddress.toLowerCase() === getStataUSDCOnBase(network.id).toLowerCase()
  );
  const stataUSDC = stataUSDCCollateral?.length ? stataUSDCCollateral[0] : undefined;
  const { data: wrapperUSDCToken } = useGetWrapperToken(getSpotMarketId(USDC?.displaySymbol));
  const usdcAddress = isBase ? wrapperUSDCToken : USDC?.tokenAddress;
  const { data: USDC_balance } = useTokenBalance(usdcAddress, network);

  const { data: wrapperStataUSDCToken } = useGetWrapperToken(
    getSpotMarketId(stataUSDC?.displaySymbol)
  );
  const stataUSDCAddress = isBase ? wrapperStataUSDCToken : stataUSDC?.tokenAddress;
  const { data: stataUSDC_balance, refetch: refetchStataUSDCBalance } = useTokenBalance(
    stataUSDCAddress,
    network
  );

  const [infiniteApproval, setInfiniteApproval] = useState(false);
  const [txState, setTxState] = useState({
    step: 1,
    status: 'idle',
  });
  const [txSummary, setTxSummary] = useState({
    usdcBalance: ZEROWEI,
    changeUsdcBalance: ZEROWEI,
    oldStataUSDCBalance: ZEROWEI,
    newStataUSDCBalance: stataUSDC_balance || ZEROWEI,
  });

  const { approve, refetchAllowance, requireApproval } = useApprove({
    contractAddress: usdcAddress,
    amount: amount.gt(0) ? utils.parseUnits(amount.toString(), USDC?.decimals) : 0,
    spender: stataUSDCAddress,
  });

  const toast = useToast({ isClosable: true, duration: 9000 });

  const { mutate: convert, isSuccess } = useConvertStataUSDC({
    amount: amount.gt(0) ? utils.parseUnits(amount.toString(), stataUSDC?.decimals) : 0,
    depositToAave: true,
  });

  const onSubmit = useCallback(async () => {
    try {
      if (txState.step > 2) {
        onSuccess();
        return;
      }

      if (txState.step === 1 && requireApproval) {
        setTxState({
          step: 1,
          status: 'pending',
        });

        await approve(infiniteApproval);
        refetchAllowance();
      }

      setTxState({
        step: 2,
        status: 'pending',
      });

      setTxSummary({
        usdcBalance: USDC_balance || ZEROWEI,
        changeUsdcBalance: amount,
        oldStataUSDCBalance: stataUSDC_balance || ZEROWEI,
        newStataUSDCBalance: ZEROWEI,
      });

      convert(undefined, {
        onError: () => {
          setTxState((state) => ({
            step: state.step,
            status: 'error',
          }));
          toast({
            title: 'Migration failed',
            description: 'Please try again.',
            status: 'error',
            variant: 'left-accent',
          });
        },
      });
    } catch (error) {
      setTxState((state) => ({
        step: state.step,
        status: 'error',
      }));
      toast({
        title: 'Migration failed',
        description: 'Please try again.',
        status: 'error',
        variant: 'left-accent',
      });
    }
  }, [
    amount,
    approve,
    convert,
    infiniteApproval,
    onSuccess,
    refetchAllowance,
    requireApproval,
    toast,
    txState.step,
    USDC_balance,
    stataUSDC_balance,
  ]);

  if (isSuccess) {
    return (
      <StepSuccess
        onConfirm={onSuccess}
        usdcBalance={txSummary.usdcBalance}
        changeUsdcBalance={txSummary.changeUsdcBalance}
        oldStataUSDCBalance={txSummary.oldStataUSDCBalance}
        newStataUSDCBalance={txSummary.newStataUSDCBalance}
      />
    );
  }

  return (
    <VStack spacing={0}>
      <Multistep
        width="100%"
        step={1}
        title="Approve USDC transfer"
        status={{
          failed: txState.step === 1 && txState.status === 'error',
          success: txState.step > 1,
          loading: txState.step === 1 && txState.status === 'pending',
        }}
        checkboxLabel="Approve unlimited USDC transfers to stataUSDC"
        checkboxProps={{
          isChecked: infiniteApproval,
          onChange: (e) => setInfiniteApproval(e.target.checked),
        }}
        mt={0}
      />

      <Multistep
        width="100%"
        step={2}
        title="Convert USDC to stataUSDC"
        mb={4}
        mt={4}
        subtitle={
          <Text>
            This will convert <Amount value={amount} suffix="USDC" /> to stataUSDC
          </Text>
        }
        status={{
          failed: txState.step === 2 && txState.status === 'error',
          success: txState.step === 2 && txState.status === 'sucess',
          loading: txState.step === 2 && txState.status === 'pending',
        }}
      />

      <Button isDisabled={txState.status === 'pending'} onClick={onSubmit} width="100%" mb={2}>
        {(() => {
          switch (true) {
            case txState.status === 'error':
              return 'Retry';
            case txState.status === 'pending':
              return 'Processing...';
            case txState.step === 2 && txState.status === 'sucess':
              return 'Done';
            default:
              return 'Execute Transaction';
          }
        })()}
      </Button>

      {txState.status !== 'pending' ? (
        <Button variant="outline" colorScheme="gray" width="100%" onClick={onBack}>
          Back
        </Button>
      ) : null}
    </VStack>
  );
};
