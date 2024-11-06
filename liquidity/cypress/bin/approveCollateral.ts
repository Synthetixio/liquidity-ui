#!/usr/bin/env ts-node

import { approveCollateral } from '../cypress/tasks/approveCollateral';
const [address, symbol, target] = process.argv.slice(2);
if (!address || !symbol) {
  throw new Error('Usage: ./approveCollateral.ts <address> <symbol> <target>');
}
approveCollateral({ address, target, symbol });
