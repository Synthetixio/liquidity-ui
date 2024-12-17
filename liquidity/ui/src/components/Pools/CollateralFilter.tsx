import { Button, Flex } from '@chakra-ui/react';
import { TokenIcon } from '@snx-v3/TokenIcon';
import { Dispatch } from 'react';
import { PoolsFilterAction } from './PoolsList';

const supportedCollateralTypes = ['WETH', 'SNX', 'USDC', 'ARB', 'wstETH'];

interface CollateralFilterProps {
  activeCollaterals: string[];
  dispatch: Dispatch<PoolsFilterAction>;
}

export const CollateralFilter = ({ activeCollaterals, dispatch }: CollateralFilterProps) => {
  const isAllActive = activeCollaterals.length === 0;

  return (
    <Flex justifyContent="center">
      <Flex
        variant="unstyled"
        bg={isAllActive ? 'whiteAlpha.300' : 'transparent'}
        onClick={() => dispatch({ type: 'RESET_COLLATERAL' })}
        color="gray.50"
        as={Button}
        px="16px"
        py="6px"
        fontWeight={600}
        borderRadius="9999px"
        mr={1.5}
        fontSize="sm"
      >
        All Collaterals
      </Flex>
      {supportedCollateralTypes.map((collateral) => {
        const isActive = activeCollaterals.includes(collateral);

        const toggle = () => {
          if (isActive) {
            dispatch({ type: 'REMOVE_COLLATERAL', payload: { collateral } });
          } else {
            dispatch({ type: 'ADD_COLLATERAL', payload: { collateral } });
          }
        };

        return (
          <Flex
            key={collateral}
            onClick={toggle}
            variant="unstyled"
            bg={isActive ? 'whiteAlpha.300' : 'transparent'}
            justifyContent="center"
            display="flex"
            mr={1.5}
            as={Button}
            px="16px"
            py="6px"
            fontWeight={600}
            borderRadius="9999px"
          >
            <TokenIcon width={18} height={18} symbol={collateral} />
          </Flex>
        );
      })}
    </Flex>
  );
};
