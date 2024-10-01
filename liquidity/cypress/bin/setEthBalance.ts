#!/usr/bin/env ts-node

import { setEthBalance } from '../cypress/tasks/setEthBalance';
const [address, balance] = process.argv.slice(2);
if (!address || !balance) {
  throw new Error('Usage: ./setEthBalance.ts <address> <balance>');
}
setEthBalance({ address, balance });
