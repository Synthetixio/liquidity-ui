import { Flex, Text, Tooltip } from '@chakra-ui/react';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { Network } from '@snx-v3/useBlockchain';
import { CollateralType } from '@snx-v3/useCollateralTypes';
import autoCompoundSvg from './auto-compound.svg';
import interestFreeLoanSvg from './interest-free-loan.svg';
import yieldOnYieldSvg from './yield-on-yield.svg';

export const Specifics: React.FC<{
  network?: Network;
  isToros?: boolean;
  collateralType?:
    | CollateralType
    | {
        address: string;
        symbol: string;
      };
}> = ({ network, isToros, collateralType }) => {
  const isBase = isBaseAndromeda(network?.id, network?.preset);

  if (isToros) {
    return (
      <Flex alignItems="center" gap={2}>
        {collateralType?.symbol?.toUpperCase() === 'wstETH'.toUpperCase() && (
          <Tooltip textAlign="left" label="Yield on yield" hasArrow>
            <img src={yieldOnYieldSvg} alt="Yield on yield" />
          </Tooltip>
        )}
        <Tooltip textAlign="left" label="Auto compounding rewards" hasArrow>
          <img src={autoCompoundSvg} alt="Auto compounding rewards" />
        </Tooltip>
      </Flex>
    );
  }

  if (isBase) {
    if (collateralType?.symbol?.toUpperCase() === 'stataUSDC'.toUpperCase()) {
      return (
        <Tooltip textAlign="left" label="Yield on yield" hasArrow>
          <img src={yieldOnYieldSvg} alt="Yield on yield" />
        </Tooltip>
      );
    }

    return (
      <Text fontFamily="heading" fontSize="14px" lineHeight="20px" fontWeight={500} color="white">
        N/A
      </Text>
    );
  }

  return (
    <Tooltip textAlign="left" label="Interest free loan" hasArrow>
      <img src={interestFreeLoanSvg} alt="Interest free loan" />
    </Tooltip>
  );
};
