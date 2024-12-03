import { ArrowBackIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Collapse,
  Divider,
  Flex,
  Text,
} from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { BorderBox } from '@snx-v3/BorderBox';
import { ZEROWEI } from '@snx-v3/constants';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { useNetwork, useProvider } from '@snx-v3/useBlockchain';
import { useClosePosition } from '@snx-v3/useClosePosition';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import React from 'react';
import { TokenIcon } from '../TokenIcon/TokenIcon';
import { ClosePositionOneStep } from './ClosePositionOneStep';
import { ClosePositionTransactions } from './ClosePositionTransactions';
import { useAccountAvailableCollateral } from './useAccountAvailableCollateral';
import { usePositionDebt } from './usePositionDebt';

function ClosePositionUi({ onSubmit, onClose }: { onClose: () => void; onSubmit: () => void }) {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: systemToken } = useSystemToken();

  const { data: liquidityPosition, isPending } = useLiquidityPosition({
    tokenAddress: collateralType?.tokenAddress,
    accountId: params.accountId,
    poolId: params.poolId,
  });
  liquidityPosition?.debt;
  liquidityPosition?.collateralAmount;
  const collateralSymbol = collateralType?.displaySymbol;

  const { network } = useNetwork();
  const isBase = isBaseAndromeda(network?.id, network?.preset);
  const debtSymbol = isBase ? 'USDC' : systemToken?.symbol;

  const provider = useProvider();
  const { data: positionDebt, isPending: isPendingPositionDebt } = usePositionDebt({
    provider,
    accountId: params.accountId,
    poolId: params.poolId,
    collateralTypeTokenAddress: collateralType?.tokenAddress,
  });
  const { data: systemTokenBalance, isPending: isPendingSystemTokenBalance } = useTokenBalance(
    systemToken?.address
  );
  const { data: accountAvailableCollateral, isPending: isPendingAccountAvailableCollateral } =
    useAccountAvailableCollateral({
      provider,
      accountId: params.accountId,
      collateralTypeTokenAddress: systemToken?.address,
    });

  const debtPrice = useTokenPrice(debtSymbol);
  const collateralPrice = useTokenPrice(collateralSymbol);

  const { data: ClosePositionDeployment } = useClosePosition();

  return (
    <Flex data-cy="close position multistep" flexDirection="column">
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon cursor="pointer" onClick={onClose} mr={2} />
        Close Position
      </Text>

      <Divider my={5} bg="gray.900" />

      <Text color="gray.50" fontSize="sm" fontWeight="700" mb={2}>
        {!isPending && liquidityPosition ? (
          <>{liquidityPosition.debt.gt(0) ? 'Repay Debt' : 'Claim Profit'}</>
        ) : (
          <>&nbsp;</>
        )}
      </Text>
      <BorderBox display="flex" flexDirection="column" p={3} mb="6">
        <Flex alignItems="center">
          <Flex alignItems="flex-start" flexDir="column" gap={1}>
            <BorderBox display="flex" justifyContent="center" alignItems="center" py={1.5} px={2.5}>
              <Text display="flex" gap={2} alignItems="center" fontWeight="600">
                <TokenIcon symbol={debtSymbol} width={16} height={16} />
                {debtSymbol}
              </Text>
            </BorderBox>
            <Text fontSize="12px" whiteSpace="nowrap" data-cy="debt amount">
              {!isPending && liquidityPosition ? (
                <>
                  <Amount
                    prefix={liquidityPosition.debt.gt(0) ? 'Debt: ' : 'Max Claim: '}
                    value={liquidityPosition.debt.abs()}
                  />{' '}
                  <Text as="span" color="gray.600" fontWeight={700}>
                    Max
                  </Text>
                </>
              ) : (
                '~'
              )}
            </Text>
          </Flex>
          <Flex flexGrow={1} flexDir="column">
            <NumberInput
              value={!isPending && liquidityPosition ? liquidityPosition.debt.abs() : ZEROWEI}
              disabled
            />
            <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
              {debtPrice.gt(0) && (
                <Amount
                  prefix="$"
                  value={
                    !isPending && liquidityPosition
                      ? liquidityPosition.debt.abs().mul(debtPrice)
                      : ZEROWEI
                  }
                />
              )}
            </Flex>
          </Flex>
        </Flex>
      </BorderBox>

      <Text color="gray.50" fontSize="sm" fontWeight="700" mb={2}>
        Unlock Collateral
      </Text>
      <BorderBox display="flex" flexDirection="column" p={3} mb="6">
        <Flex alignItems="center">
          <Flex alignItems="flex-start" flexDir="column" gap={1}>
            <BorderBox display="flex" justifyContent="center" alignItems="center" py={1.5} px={2.5}>
              <Text display="flex" gap={2} alignItems="center" fontWeight="600">
                <TokenIcon symbol={collateralSymbol} width={16} height={16} />
                {collateralSymbol}
              </Text>
            </BorderBox>
            <Text fontSize="12px" whiteSpace="nowrap" data-cy="locked collateral amount">
              {!isPending && liquidityPosition ? (
                <>
                  <Amount prefix="Locked: " value={liquidityPosition.collateralAmount} />{' '}
                  <Text as="span" color="gray.600" fontWeight={700}>
                    Max
                  </Text>
                </>
              ) : (
                '~'
              )}
            </Text>
          </Flex>
          <Flex flexGrow={1} flexDir="column">
            <NumberInput
              value={!isPending && liquidityPosition ? liquidityPosition.collateralAmount : ZEROWEI}
              disabled
            />
            <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
              {collateralPrice.gt(0) && (
                <Amount
                  prefix="$"
                  value={
                    !isPending && liquidityPosition
                      ? liquidityPosition.collateralAmount.abs().mul(collateralPrice)
                      : ZEROWEI
                  }
                />
              )}
            </Flex>
          </Flex>
        </Flex>
      </BorderBox>

      <Collapse
        in={
          // Deployments that do not have ClosePosition contract available should skip this check
          ClosePositionDeployment &&
          systemTokenBalance &&
          positionDebt &&
          accountAvailableCollateral &&
          !systemTokenBalance.add(accountAvailableCollateral).gte(positionDebt)
        }
        animateOpacity
      >
        <Alert mb={6} status="error" borderRadius="6px">
          <AlertIcon />
          <AlertDescription>
            <Text>You do not have enough {systemToken?.symbol} to repay debt</Text>
            <Text>
              <Amount
                prefix="Available: "
                value={
                  systemTokenBalance &&
                  accountAvailableCollateral &&
                  systemTokenBalance.add(accountAvailableCollateral)
                }
                suffix={` ${systemToken?.symbol}`}
              />
            </Text>
          </AlertDescription>
        </Alert>
      </Collapse>

      <Button
        data-cy="close position submit"
        onClick={onSubmit}
        type="submit"
        isDisabled={
          // Deployments that do not have ClosePosition contract available should skip this check
          ClosePositionDeployment &&
          !(
            !isPendingPositionDebt &&
            !isPendingSystemTokenBalance &&
            !isPendingAccountAvailableCollateral &&
            systemTokenBalance &&
            accountAvailableCollateral &&
            positionDebt &&
            systemTokenBalance.add(accountAvailableCollateral).gte(positionDebt)
          )
        }
      >
        Close Position
      </Button>
    </Flex>
  );
}

export const ClosePosition = ({ onClose }: { onClose: () => void }) => {
  const [params] = useParams<PositionPageSchemaType>();

  const [transactionStep, setTransactions] = React.useState(false);
  const { setCollateralChange, setDebtChange } = React.useContext(ManagePositionContext);
  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { data: liquidityPosition } = useLiquidityPosition({
    tokenAddress: collateralType?.tokenAddress,
    accountId: params.accountId,
    poolId: params.poolId,
  });

  React.useEffect(() => {
    if (liquidityPosition) {
      setDebtChange(liquidityPosition.debt.mul(-1));
      setCollateralChange(liquidityPosition.collateralAmount.mul(-1));
    }

    return () => {
      setDebtChange(ZEROWEI);
      setCollateralChange(ZEROWEI);
    };
  }, [liquidityPosition, setCollateralChange, setDebtChange]);

  const { data: ClosePositionDeployment } = useClosePosition();

  if (!collateralType) {
    return null;
  }

  return (
    <>
      {!transactionStep ? (
        <ClosePositionUi onClose={onClose} onSubmit={() => setTransactions(true)} />
      ) : null}
      {transactionStep && !ClosePositionDeployment ? (
        <ClosePositionTransactions
          onBack={() => setTransactions(false)}
          onClose={onClose}
          collateralType={collateralType}
          liquidityPosition={liquidityPosition}
        />
      ) : null}
      {transactionStep && ClosePositionDeployment ? (
        <ClosePositionOneStep onBack={() => setTransactions(false)} onClose={onClose} />
      ) : null}
    </>
  );
};
