import { stringToHash } from './stringToHash';

export function contractsHash(Contracts: ({ address: string } | undefined)[]) {
  // If any of the contracts are undefined - treat all as undefined.
  // We only care when we have all contracts ready
  if (Contracts.some((Contract) => Contract === undefined)) {
    return '~';
  }
  return stringToHash(
    Contracts.map((Contract) => Contract?.address.toLowerCase() || '')
      .sort()
      .join()
  );
}
