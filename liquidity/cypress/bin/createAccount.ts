#!/usr/bin/env ts-node

import { createAccount } from '../cypress/tasks/createAccount';
const [address] = process.argv.slice(2);
if (!address) {
  throw new Error('Usage: ./approveCollateral.ts <address>');
}
createAccount({ address });
