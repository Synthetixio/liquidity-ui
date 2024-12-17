import { Image, type ImageProps } from '@chakra-ui/react';

export function TokenIcon({
  symbol,
  width = 30,
  height = 30,
  ...props
}: ImageProps & {
  symbol?: string;
  width?: number;
  height?: number;
}) {
  const src = `https://assets.synthetix.io/synths/${symbol ? symbol.toUpperCase() : 'UNKNOWN'}.svg`;
  return (
    <Image
      src={src}
      fallbackSrc="https://assets.synthetix.io/collateral/UNKNOWN.svg"
      alt={symbol}
      style={{ width, height }}
      {...props}
    />
  );
}

export const SynthIcon = ({
  symbol,
  width = 30,
  height = 30,
  ...props
}: ImageProps & {
  symbol?: string;
  width?: number;
  height?: number;
}) => {
  const src = `https://assets.synthetix.io/synths/${symbol ?? 'UNKNOWN'}.svg`;
  return (
    <Image
      src={src}
      fallbackSrc="https://assets.synthetix.io/collateral/UNKNOWN.svg"
      alt={symbol}
      style={{ width, height }}
      {...props}
    />
  );
};
