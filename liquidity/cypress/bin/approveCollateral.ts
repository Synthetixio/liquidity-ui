#!/usr/bin/env ts-node

import { approveCollateral } from '../cypress/tasks/approveCollateral';
const [address, symbol] = process.argv.slice(2);
if (!address || !symbol) {
  throw new Error('Usage: ./approveCollateral.ts <address> <symbol>');
}
approveCollateral({ address, symbol });
