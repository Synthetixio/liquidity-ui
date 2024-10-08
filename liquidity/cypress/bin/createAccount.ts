#!/usr/bin/env ts-node

import { createAccount } from '../cypress/tasks/createAccount';
const [privateKey] = process.argv.slice(2);
if (!privateKey) {
  throw new Error('Usage: ./approveCollateral.ts <privateKey>');
}
createAccount({ privateKey });
