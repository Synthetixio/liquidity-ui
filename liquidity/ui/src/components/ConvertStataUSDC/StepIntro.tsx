import React, { useEffect, useState } from 'react';
import {
  VStack,
  Text,
  Button,
  Flex,
  Collapse,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { NumberInput } from '@snx-v3/NumberInput';
import { Network } from '@snx-v3/useBlockchain';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import Wei from '@synthetixio/wei';
import { ZEROWEI } from '@snx-v3/constants';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { TokenIcon } from '../TokenIcon';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useGetWrapperToken } from '@snx-v3/useGetUSDTokens';
import { getSpotMarketId, isBaseAndromeda } from '@snx-v3/isBaseAndromeda';

export const StepIntro = ({
  onClose,
  onConfirm,
  setAmount,
  amount,
  network,
}: {
  onClose: () => void;
  onConfirm: () => void;
  setAmount: (val: Wei) => void;
  amount: Wei;
  network: Network;
}) => {
  const [loaded, setLoaded] = useState(false);

  const { data: USDC } = useCollateralType('USDC');
  const { data: wrapperUSDCToken } = useGetWrapperToken(getSpotMarketId(USDC?.displaySymbol));
  // TODO: This will need refactoring
  const usdcAddress = isBaseAndromeda(network?.id, network?.preset)
    ? wrapperUSDCToken
    : USDC?.tokenAddress;
  const { data: USDC_balance } = useTokenBalance(usdcAddress, network);

  const { data: stataUSDC } = useCollateralType('stataUSDC');
  const { data: wrapperStataUSDCToken } = useGetWrapperToken(
    getSpotMarketId(stataUSDC?.displaySymbol)
  );
  // TODO: This will need refactoring
  const stataUSDCAddress = isBaseAndromeda(network?.id, network?.preset)
    ? wrapperStataUSDCToken
    : stataUSDC?.tokenAddress;
  const { data: stataUSDC_balance } = useTokenBalance(stataUSDCAddress, network);

  const [estimatedAmount, setEstimatedAmount] = useState<Wei>(new Wei(0));

  useEffect(() => {
    if (USDC_balance && amount.eq(0) && !loaded) {
      setAmount(USDC_balance);
      setLoaded(true);
    }
  }, [amount, loaded, setAmount, USDC_balance]);

  // Update estimated stataUSDC amount when USDC amount changes
  useEffect(() => {
    //TODO: Get stataUSDC exchange rate
    const exchangeRate = new Wei(1);
    const estimatedAmount = amount.mul(exchangeRate);
    setEstimatedAmount(estimatedAmount);
  }, [amount]);

  return (
    <VStack gap={2.5}>
      <Text width="100%" textAlign="left" fontSize="14px">
        Convert your USDC to Aave stataUSDC.
      </Text>

      <BorderBox width="100%" display="flex" flexDirection="column" p={3}>
        <Flex alignItems="center">
          <Flex flexDir="column" gap="1">
            <Flex flexDir="column" gap="1">
              <BorderBox
                display="flex"
                justifyContent="center"
                alignItems="center"
                py={1.5}
                px={2.5}
                width="fit-content"
              >
                <Text display="flex" gap={2} alignItems="center" fontWeight="600">
                  <TokenIcon symbol="usdc" width={16} height={16} />
                  USDC
                </Text>
              </BorderBox>
              <Flex fontSize="xs" color="whiteAlpha.700" gap="1">
                Balance: <Amount value={USDC_balance} />
                <Text
                  as="span"
                  cursor="pointer"
                  onClick={() => {
                    if (!USDC_balance) {
                      return;
                    }
                    setAmount(USDC_balance);
                  }}
                  color={USDC_balance?.eq(amount) ? 'gray.600' : 'cyan.500'}
                  fontWeight={700}
                >
                  &nbsp;Max
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex flexDir="column" flexGrow={1}>
            <NumberInput
              InputProps={{
                isRequired: true,
                'data-max': USDC_balance?.toString(),
                type: 'number',
                min: 0,
              }}
              value={amount}
              onChange={(val) => setAmount(val)}
              min={ZEROWEI}
            />
          </Flex>
        </Flex>
      </BorderBox>

      <BorderBox width="100%" display="flex" flexDirection="column" p={3}>
        <Flex alignItems="center">
          <Flex flexDir="column" gap="1">
            <BorderBox
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={1.5}
              px={2.5}
              width="fit-content"
            >
              <Text display="flex" gap={2} alignItems="center" fontWeight="600">
                <TokenIcon symbol="statausdc" width={16} height={16} />
                stataUSDC
              </Text>
            </BorderBox>
            <Flex fontSize="xs" color="whiteAlpha.700" gap="1">
              Balance: <Amount value={stataUSDC_balance} />
            </Flex>
          </Flex>
          <Flex flexDir="column" flexGrow={1}>
            <NumberInput disabled value={estimatedAmount} />
          </Flex>
        </Flex>
      </BorderBox>

      <Collapse in={USDC_balance?.lt(amount)} animateOpacity>
        <Alert borderRadius="6px" status="error">
          <AlertIcon />
          <AlertDescription>You cannot convert more than your USDC balance</AlertDescription>
        </Alert>
      </Collapse>

      <Button
        isDisabled={USDC_balance?.lt(amount) || amount.lte(0)}
        mt={3}
        width="100%"
        onClick={onConfirm}
      >
        Convert
      </Button>
      <Button variant="outline" colorScheme="gray" onClick={onClose} width="100%">
        Later
      </Button>
    </VStack>
  );
};
