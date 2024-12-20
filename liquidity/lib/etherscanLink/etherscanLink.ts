export function etherscanLink({
  chain,
  address,
  isTx = false,
}: {
  chain: string;
  address: string;
  isTx?: boolean;
}): string {
  switch (chain) {
    case 'sepolia':
      return `https://sepolia.etherscan.io/${isTx ? 'tx' : 'address'}/${address}`;
    case 'arbitrum':
      return `https://arbiscan.io/${isTx ? 'tx' : 'address'}/${address}`;
    case 'optimism':
      return `https://optimistic.etherscan.io/${isTx ? 'tx' : 'address'}/${address}`;
    case 'base':
      return `https://basescan.org/${isTx ? 'tx' : 'address'}/${address}`;
    case 'base-sepolia':
      return `https://sepolia.basescan.org/${isTx ? 'tx' : 'address'}/${address}`;
    case 'mainnet':
    default:
      return `https://etherscan.io/${isTx ? 'tx' : 'address'}/${address}`;
  }
}

export function transactionLink({
  chainId,
  txnHash,
}: {
  chainId?: number;
  txnHash?: string | null;
}) {
  switch (chainId) {
    case 1:
      return `https://etherscan.io/tx/${txnHash}`;
    case 11155420:
      return `https://sepolia.etherscan.io/tx/${txnHash}`;
    case 42161:
      return `https://arbiscan.io/tx/${txnHash}`;
    case 421614:
      return `https://sepolia.arbiscan.io/tx/${txnHash}`;
    case 10:
      return `https://optimistic.etherscan.io/tx/${txnHash}`;
    case 8453:
      return `https://basescan.org/tx/${txnHash}`;
    case 84532:
      return `https://sepolia.basescan.org/tx/${txnHash}`;
  }
}
