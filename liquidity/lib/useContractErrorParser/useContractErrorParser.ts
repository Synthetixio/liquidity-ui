import { useAllErrors } from '@snx-v3/useAllErrors';
import { useClosePosition } from '@snx-v3/useClosePosition';
import { parseContractError } from '@snx-v3/parseContractError';
import { useCallback } from 'react';

export function useContractErrorParser() {
  const { data: AllErrors } = useAllErrors();
  const { data: ClosePosition } = useClosePosition();

  return useCallback(
    (error: any) => {
      return parseContractError({ error, AllErrors, ClosePosition });
    },
    [AllErrors, ClosePosition]
  );
}
