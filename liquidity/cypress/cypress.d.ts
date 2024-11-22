import { mount } from 'cypress/react';

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;

      approveCollateral: ({
        address,
        symbol,
        spender,
      }: {
        address?: string;
        symbol: string;
        spender: string;
      }) => Promise<void>;

      borrowUsd: ({
        address,
        accountId,
        symbol,
        amount,
        poolId,
      }: {
        address?: string;
        accountId?: string;
        symbol: string;
        amount: number;
        poolId: number;
      }) => Promise<void>;

      delegateCollateral: ({
        address,
        accountId,
        symbol,
        amount,
        poolId,
      }: {
        address?: string;
        accountId?: string;
        symbol: string;
        amount: number;
        poolId: number;
      }) => Promise<void>;

      depositCollateral: ({
        address,
        accountId,
        symbol,
        amount,
      }: {
        address?: string;
        accountId?: string;
        symbol: string;
        amount: number;
      }) => Promise<void>;

      getSNX: ({ address, amount }: { address?: string; amount: number }) => Promise<void>;

      getUSDC: ({ address, amount }: { address?: string; amount: number }) => Promise<void>;

      setEthBalance: ({ address, balance }: { address?: string; balance: number }) => Promise<void>;

      wrapCollateral: ({
        address,
        symbol,
        amount,
      }: {
        address?: string;
        symbol: string;
        amount: number;
      }) => Promise<void>;

      wrapEth: ({ address, amount }: { address?: string; amount: number }) => Promise<void>;
    }
  }
}
