import { Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { calculateCRatio } from '@snx-v3/calculations';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { validatePosition } from '@snx-v3/validatePosition';
import { useContext } from 'react';
import { CRatioBar } from '../CRatioBar/CRatioBar';
import { CollateralStats } from './CollateralStats';
import { DebtStats } from './DebtStats';
import { PnlStats } from './PnlStats';

export function ManageStats() {
  const [params] = useParams<PositionPageSchemaType>();
  const { network } = useNetwork();

  const { debtChange, collateralChange } = useContext(ManagePositionContext);

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: liquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const cRatio = calculateCRatio(liquidityPosition?.debt, liquidityPosition?.collateralValue);
  const { newCRatio, newCollateralAmount, newDebt, hasChanges } = validatePosition({
    issuanceRatioD18: collateralType?.issuanceRatioD18,
    collateralAmount: liquidityPosition?.collateralAmount,
    collateralPrice: liquidityPosition?.collateralPrice,
    debt: liquidityPosition?.debt,
    collateralChange: collateralChange,
    debtChange: debtChange,
  });

  return (
    <Flex direction="column" gap={4}>
      <Text color="white" fontSize="lg" fontFamily="heading" fontWeight="bold" lineHeight="16px">
        Overview
      </Text>
      <Flex flexWrap="wrap" direction={['column', 'row']} gap={4}>
        <CollateralStats newCollateralAmount={newCollateralAmount} hasChanges={hasChanges} />
        {network?.preset === 'andromeda' ? (
          <PnlStats newDebt={newDebt} hasChanges={hasChanges} />
        ) : (
          <DebtStats newDebt={newDebt} hasChanges={hasChanges} />
        )}
      </Flex>
      {network?.preset === 'andromeda' ? null : (
        <BorderBox py={4} px={6} flexDirection="column" bg="navy.700">
          <CRatioBar
            hasChanges={hasChanges}
            currentCRatio={
              liquidityPosition?.collateralValue.gt(0) && liquidityPosition?.debt.eq(0)
                ? Number.MAX_SAFE_INTEGER
                : cRatio.toNumber() * 100
            }
            liquidationCratio={(collateralType?.liquidationRatioD18?.toNumber() || 0) * 100}
            newCRatio={
              newCollateralAmount.gt(0) && newDebt.eq(0)
                ? Number.MAX_SAFE_INTEGER
                : newCRatio.toNumber() * 100
            }
            targetCratio={(collateralType?.issuanceRatioD18.toNumber() || 0) * 100}
          />
        </BorderBox>
      )}
    </Flex>
  );
}
