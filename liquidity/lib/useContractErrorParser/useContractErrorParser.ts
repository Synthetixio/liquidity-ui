import { useAllErrors } from '@snx-v3/useAllErrors';
import { useClosePosition } from '@snx-v3/useClosePosition';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { usePositionManager } from '@snx-v3/usePositionManager';
import { usePositionManagerAndromedaStataUSDC } from '@snx-v3/usePositionManagerAndromedaStataUSDC';
import { usePositionManagerAndromedaUSDC } from '@snx-v3/usePositionManagerAndromedaUSDC';
import { parseContractError, combineErrors } from '@snx-v3/parseContractError';
import { useCallback } from 'react';

export function useContractErrorParser() {
  const { data: AllErrors } = useAllErrors();
  const { data: ClosePosition } = useClosePosition();
  const { data: StaticAaveUSDC } = useStaticAaveUSDC();
  const { data: PositionManager } = usePositionManager();
  const { data: PositionManagerAndromedaStataUSDC } = usePositionManagerAndromedaStataUSDC();
  const { data: PositionManagerAndromedaUSDC } = usePositionManagerAndromedaUSDC();

  return useCallback(
    (error: any) => {
      return parseContractError({
        error,
        abi: combineErrors([
          AllErrors,
          ClosePosition,
          StaticAaveUSDC,
          PositionManager,
          PositionManagerAndromedaStataUSDC,
          PositionManagerAndromedaUSDC,
        ]),
      });
    },
    [
      AllErrors,
      ClosePosition,
      PositionManager,
      PositionManagerAndromedaStataUSDC,
      PositionManagerAndromedaUSDC,
      StaticAaveUSDC,
    ]
  );
}
