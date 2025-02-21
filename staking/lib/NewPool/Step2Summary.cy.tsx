import { Box } from '@chakra-ui/react';
import { wei } from '@synthetixio/wei';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import injectedModule from '@web3-onboard/injected-wallets';
import { init } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { Step2Summary } from './Step2Summary';

it(`${import.meta.url.split('/').pop()}`, () => {
  const queryClient = new QueryClient();
  init({ wallets: [injectedModule()], chains: [{ id: 1 }] });
  cy.intercept('https://hermes-mainnet.rpc.extrnode.com/**', (req) => {
    return req.reply([
      {
        id: '39d020f60982ed892abbcd4a06a276a9f9b7bfbce003204c110b6e488f502da3',
        price: {
          price: '200000000',
          conf: '182450',
          expo: -8,
          publish_time: 1739161110,
        },
        ema_price: {
          price: '200000000',
          conf: '166473',
          expo: -8,
          publish_time: 1739161110,
        },
      },
    ]);
  }).as('snx-price');
  localStorage.setItem('chakra-ui-color-mode', 'dark');

  queryClient.setQueryData(
    ['undefined-undefined', 'LiquidityPosition', {}, {}, { contractsHash: '~' }],
    {
      collateralType: {
        tokenAddress: '0x123',
        symbol: 'SNX',
      },
      collateralPrice: wei(2),
      availableCollateral: wei(0),
      availableSystemToken: wei(0),
      collateralAmount: wei(500),
      collateralValue: wei(0),
      debt: wei(50),
      cRatio: wei(4),
      totalDeposited: wei(0),
      totalAssigned: wei(0),
      totalLocked: wei(0),
    }
  );
  queryClient.setQueryData(
    ['undefined-undefined', 'New Pool', 'targetCRatio', { contractsHash: '~' }],
    ethers.utils.parseEther('2')
  );

  cy.mount(
    <QueryClientProvider client={queryClient}>
      <Box p={3} data-cy="Step2Summary">
        <Step2Summary onConfirm={() => {}} onClose={() => {}} />
      </Box>
    </QueryClientProvider>
  );

  cy.get('[data-cy="Step2Summary"]')
    .should('include.text', 'Total collateral')
    .and('include.text', '$1,000 SNX');

  cy.get('[data-cy="Step2Summary"]').should('include.text', 'C-Ratio').and('include.text', '400%');

  cy.get('[data-cy="Step2Summary"]').should('include.text', 'Loan').and('include.text', '$50 sUSD');

  cy.contains('[data-cy="Step2Summary"] button', 'Migrate').should('be.disabled');
  cy.contains('[data-cy="Step2Summary"] button', 'Cancel').should('be.enabled');
});
