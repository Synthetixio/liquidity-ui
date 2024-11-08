#!/usr/bin/env ts-node

import { createAccount } from '../cypress/tasks/createAccount';
const [address, accountId] = process.argv.slice(2);
if (!address || !accountId) {
  throw new Error('Usage: ./approveCollateral.ts <address> <accountId>');
}
createAccount({ address, accountId });
