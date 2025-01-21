export function getStatsUrl(chainId?: number) {
  if (chainId === 1) {
    return 'https://stats.synthetix.io/all/?page=ethereum';
  }
  if (chainId === 10) {
    return 'https://stats.synthetix.io/all/?page=optimism';
  }
  if (chainId === 8453) {
    return 'https://stats.synthetix.io/all/?page=base';
  }
  if (chainId === 42161) {
    return 'https://stats.synthetix.io/all/?page=arbitrum';
  }
  return 'https://stats.synthetix.io/all/';
}
