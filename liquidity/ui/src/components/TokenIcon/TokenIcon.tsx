import { Image, ImageProps } from '@chakra-ui/react';

interface TokenIconProps extends ImageProps {
  symbol?: string;
  width?: number;
  height?: number;
}

export const TokenIcon = ({ symbol, width = 30, height = 30, ...props }: TokenIconProps) => {
  return symbol ? (
    <Image
      src={`https://assets.synthetix.io/collateral/${symbol?.toUpperCase()}.svg`}
      fallback={
        <Image
          src={`https://assets.synthetix.io/synths/${symbol}.svg`}
          fallbackSrc="https://assets.synthetix.io/collateral/UNKNOWN.svg"
          alt={symbol}
          style={{ width, height }}
          {...props}
        />
      }
      alt={symbol}
      style={{ width, height }}
      {...props}
    />
  ) : (
    <Image
      src="https://assets.synthetix.io/collateral/UNKNOWN.svg"
      fallbackSrc="https://assets.synthetix.io/collateral/UNKNOWN.svg"
      alt={symbol}
      style={{ width, height }}
      {...props}
    />
  );
};
