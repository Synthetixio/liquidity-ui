import { useAllErrors } from '@snx-v3/useAllErrors';
import { useClosePosition } from '@snx-v3/useClosePosition';
import { useStaticAaveUSDC } from '@snx-v3/useStaticAaveUSDC';
import { parseContractError } from '@snx-v3/parseContractError';
import { useCallback } from 'react';

export function useContractErrorParser() {
  const { data: AllErrors } = useAllErrors();
  const { data: ClosePosition } = useClosePosition();
  const { data: StaticAaveUSDC } = useStaticAaveUSDC();

  return useCallback(
    (error: any) => {
      return parseContractError({
        error,
        AllErrors,
        extraAbi: [
          ...(StaticAaveUSDC ? StaticAaveUSDC.abi : []),
          ...(ClosePosition ? ClosePosition.abi : []),
        ],
      });
    },
    [AllErrors, ClosePosition, StaticAaveUSDC]
  );
}
