import { Badge, Link, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { useNetwork } from '@snx-v3/useBlockchain';
import Wei from '@synthetixio/wei';
import { useMemo } from 'react';

export function Balance({
  balance,
  symbol,
  address,
  onMax,
  hideBuyButton,
}: {
  balance?: Wei;
  symbol: string;
  address: string;
  onMax?: (balance: Wei) => void;
  hideBuyButton?: boolean;
}) {
  const { network } = useNetwork();
  const buyAssetLink = useMemo(() => {
    switch (network?.name) {
      case 'goerli':
        return `https://goerli.etherscan.io/address/${address}#writeContract`;
      case 'sepolia':
        return `https://sepolia.etherscan.io/address/${address}#writeContract`;
      case 'optimism-goerli':
        return `https://goerli-optimism.etherscan.io/address/${address}#writeContract`;
      case 'optimism':
        return `https://app.1inch.io/#/10/unified/swap/ETH/${symbol.toUpperCase()}`;
      default:
        return `https://app.1inch.io/#/1/unified/swap/ETH/${symbol.toUpperCase()}`;
    }
  }, [address, network?.name, symbol]);

  return (
    <Text display="flex" gap={2} alignItems="center" fontSize="xs">
      Balance:
      <Amount value={balance} suffix={` ${symbol}`} />
      {balance && balance.eq(0) && buyAssetLink && !hideBuyButton && (
        <Link href={buyAssetLink} isExternal>
          <Badge ml="1" variant="outline" transform="translateY(-1px)">
            Buy {symbol}
          </Badge>
        </Link>
      )}
      {onMax && balance?.gt(0) && (
        <Badge as="button" type="button" variant="outline" onClick={() => onMax(balance)}>
          Use Max
        </Badge>
      )}
    </Text>
  );
}
