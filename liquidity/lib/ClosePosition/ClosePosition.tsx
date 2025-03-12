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
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { NumberInput } from '@snx-v3/NumberInput';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useClosePosition } from '@snx-v3/useClosePosition';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { useSystemToken } from '@snx-v3/useSystemToken';
import { useTokenBalance } from '@snx-v3/useTokenBalance';
import { useTokenPrice } from '@snx-v3/useTokenPrice';
import React from 'react';
import { ClosePositionOneStep } from './ClosePositionOneStep';
import { ClosePositionTransactions } from './ClosePositionTransactions';

function ClosePositionUi({ onSubmit, onClose }: { onClose: () => void; onSubmit: () => void }) {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: systemToken } = useSystemToken();

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });
  const collateralSymbol = collateralType?.displaySymbol;

  const { network } = useNetwork();
  const debtSymbol = network?.preset === 'andromeda' ? 'USDC' : systemToken?.symbol;

  const { data: systemTokenBalance, isPending: isPendingSystemTokenBalance } = useTokenBalance(
    systemToken?.address
  );

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
        {!isPendingLiquidityPosition && liquidityPosition ? (
          <>{liquidityPosition.debt.gt(0) ? 'Repay Debt' : 'Claim Profit'}</>
        ) : (
          <>&nbsp;</>
        )}
      </Text>
      <BorderBox display="flex" flexDirection="column" p={3} mb="6">
        <Flex alignItems="center">
          <Flex alignItems="flex-start" flexDir="column" gap={1}>
            <BorderBox display="flex" justifyContent="center" alignItems="center" py={1.5} px={2.5}>
              <Text display="flex" gap={2} alignItems="center" fontWeight="600" whiteSpace="nowrap">
                <TokenIcon symbol={debtSymbol} width={16} height={16} />
                {network?.preset === 'andromeda' ? 'USDC' : systemToken?.displaySymbol}
              </Text>
            </BorderBox>
            <Text fontSize="12px" whiteSpace="nowrap" data-cy="debt amount">
              {isPendingLiquidityPosition ? '~' : null}
              {!isPendingLiquidityPosition && liquidityPosition ? (
                <>
                  <Amount
                    prefix={liquidityPosition.debt.gt(0) ? 'Debt: ' : 'Max Claim: '}
                    value={liquidityPosition.debt.abs()}
                  />{' '}
                  <Text as="span" color="gray.600" fontWeight={700}>
                    Max
                  </Text>
                </>
              ) : null}
            </Text>
          </Flex>
          <Flex flexGrow={1} flexDir="column">
            <NumberInput
              value={
                !isPendingLiquidityPosition && liquidityPosition
                  ? liquidityPosition.debt.abs()
                  : ZEROWEI
              }
              disabled
            />
            <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
              {debtPrice.gt(0) && (
                <Amount
                  prefix="$"
                  value={
                    !isPendingLiquidityPosition && liquidityPosition
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
              <Text display="flex" gap={2} alignItems="center" fontWeight="600" whiteSpace="nowrap">
                <TokenIcon symbol={collateralSymbol} width={16} height={16} />
                {collateralSymbol}
              </Text>
            </BorderBox>
            <Text fontSize="12px" whiteSpace="nowrap" data-cy="locked collateral amount">
              {isPendingLiquidityPosition ? 'Locked: ~' : null}
              {!isPendingLiquidityPosition && liquidityPosition ? (
                <>
                  <Amount prefix="Locked: " value={liquidityPosition.collateralAmount} />{' '}
                  <Text as="span" color="gray.600" fontWeight={700}>
                    Max
                  </Text>
                </>
              ) : null}
            </Text>
          </Flex>
          <Flex flexGrow={1} flexDir="column">
            <NumberInput
              value={
                !isPendingLiquidityPosition && liquidityPosition
                  ? liquidityPosition.collateralAmount
                  : ZEROWEI
              }
              disabled
            />
            <Flex fontSize="xs" color="whiteAlpha.700" alignSelf="flex-end" gap="1">
              {collateralPrice.gt(0) && (
                <Amount
                  prefix="$"
                  value={
                    !isPendingLiquidityPosition && liquidityPosition
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
          liquidityPosition &&
          !systemTokenBalance
            .add(liquidityPosition.availableSystemToken)
            .gte(liquidityPosition.debt)
        }
        animateOpacity
        unmountOnExit
      >
        <Alert mb={6} status="error" borderRadius="6px">
          <AlertIcon />
          <AlertDescription>
            <Text>You do not have enough {systemToken?.displaySymbol} to repay debt</Text>
            <Text>
              <Amount
                prefix="Available: "
                value={
                  systemTokenBalance &&
                  liquidityPosition &&
                  systemTokenBalance.add(liquidityPosition.availableSystemToken)
                }
                suffix={` ${systemToken?.displaySymbol}`}
              />
            </Text>
          </AlertDescription>
        </Alert>
      </Collapse>

      <Button
        data-cy="close position submit"
        onClick={() => {
          window?._paq?.push([
            'trackEvent',
            'liquidity',
            'v3_staking',
            `click_close_position_${collateralType?.symbol?.toLowerCase()}_v3`,
          ]);
          onSubmit();
        }}
        type="submit"
        isDisabled={
          // Deployments that do not have ClosePosition contract available should skip this check
          ClosePositionDeployment &&
          !(
            !isPendingSystemTokenBalance &&
            systemTokenBalance &&
            !isPendingLiquidityPosition &&
            liquidityPosition &&
            systemTokenBalance
              .add(liquidityPosition.availableSystemToken)
              .gte(liquidityPosition.debt)
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
    accountId: params.accountId,
    collateralType,
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
        <ClosePositionTransactions onBack={() => setTransactions(false)} onClose={onClose} />
      ) : null}
      {transactionStep && ClosePositionDeployment ? (
        <ClosePositionOneStep onBack={() => setTransactions(false)} onClose={onClose} />
      ) : null}
    </>
  );
};
