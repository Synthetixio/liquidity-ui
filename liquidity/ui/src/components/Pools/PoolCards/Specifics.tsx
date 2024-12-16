import { Text, Tooltip } from '@chakra-ui/react';
import { Network } from '@snx-v3/useBlockchain';
import { useIsSynthStataUSDC } from '@snx-v3/useIsSynthStataUSDC';
import interestFreeLoanSvg from './interest-free-loan.svg';
import yieldOnYieldSvg from './yield-on-yield.svg';

export function Specifics({
  network,
  collateralType,
}: {
  network?: Network;
  collateralType?: {
    address: string;
    symbol: string;
  };
}) {
  const isStataUSDC = useIsSynthStataUSDC({
    tokenAddress: collateralType?.address,
    customNetwork: network,
  });

  if (isStataUSDC) {
    return (
      <Tooltip textAlign="left" label="Yield on yield" hasArrow>
        <img src={yieldOnYieldSvg} alt="Yield on yield" />
      </Tooltip>
    );
  }

  if (network?.preset === 'andromeda') {
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
}
