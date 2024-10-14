import { useAllErrors } from '@snx-v3/useAllErrors';
import { extractErrorData, PYTH_ERRORS } from '@snx-v3/withERC7412';
import { ethers } from 'ethers';
import { useCallback } from 'react';

const ERC721_ERRORS = [
  'error CannotSelfApprove(address addr)',
  'error InvalidTransferRecipient(address addr)',
  'error InvalidOwner(address addr)',
  'error TokenDoesNotExist(uint256 id)',
  'error TokenAlreadyMinted(uint256 id)',
];

export type ContractErrorType = {
  data: string;
  name: string;
  signature: string;
  args: Record<string, any>;
};

export function useContractErrorParser() {
  const { data: AllErrors } = useAllErrors();

  return useCallback(
    (error: any): ContractErrorType | undefined => {
      if (!AllErrors) {
        return undefined;
      }
      try {
        const errorData = extractErrorData(error);
        if (!errorData) {
          console.error({ error }); // intentional logging as object so we can inspect all properties
          return undefined;
        }
        const AllErrorsInterface = new ethers.utils.Interface([
          ...AllErrors.abi,
          ...PYTH_ERRORS,
          ...ERC721_ERRORS,
        ]);

        const errorParsed = AllErrorsInterface.parseError(errorData);
        const errorArgs = Object.fromEntries(
          Object.entries(errorParsed.args)
            .filter(([key]) => `${parseInt(key)}` !== key)
            .map(([key, value]) => {
              if (value instanceof ethers.BigNumber) {
                // Guess wei
                const unwei = parseFloat(ethers.utils.formatEther(value.toString()));
                if (unwei > 0.001) {
                  // must be wei
                  return [key, unwei];
                }

                // Guess date
                if (
                  value.toNumber() > new Date(2000, 1, 1).getTime() / 1000 &&
                  value.toNumber() < new Date(2100, 1, 1).getTime() / 1000
                ) {
                  return [key, new Date(value.toNumber() * 1000)];
                }

                // Just a number
                return [key, parseFloat(value.toString())];
              }

              // Not a number
              return [key, value];
            })
        );

        return {
          data: errorData,
          name: errorParsed.name,
          signature: errorParsed.signature,
          args: errorArgs,
        };
      } catch (e) {
        console.error(e);
        return undefined;
      }
    },
    [AllErrors]
  );
}
