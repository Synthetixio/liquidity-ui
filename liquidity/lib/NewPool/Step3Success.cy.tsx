import { Box } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import injectedModule from '@web3-onboard/injected-wallets';
import { init } from '@web3-onboard/react';
import { ethers } from 'ethers';
import React from 'react';
import { Step3Success } from './Step3Success';

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
    ['undefined-undefined', 'New Pool', 'useLoanedAmount', {}, { contractsHash: '~' }],
    ethers.utils.parseEther('123.45')
  );
  queryClient.setQueryData(
    [
      'undefined-undefined',
      'New Pool',
      'positionCollateral',
      { poolId: 8 },
      { contractsHash: '~' },
    ],
    ethers.utils.parseEther('500')
  );

  cy.mount(
    <QueryClientProvider client={queryClient}>
      <Box p={3} data-cy="Step3Success">
        <Step3Success receipt={{ transactionHash: '0x111000777' }} onConfirm={() => {}} />
      </Box>
    </QueryClientProvider>
  );

  cy.get('[data-cy="Step3Success"]')
    .should('include.text', 'Total collateral')
    .and('include.text', '$1,000 SNX');

  cy.get('[data-cy="Step3Success"]')
    .should('include.text', 'Loaned amount')
    .and('include.text', '$123.45 sUSD');

  cy.get('[data-cy="Step3Success"]')
    .should('include.text', 'Transaction')
    .and('include.text', '0x111...0777');

  cy.contains('[data-cy="Step3Success"] button', 'Continue').should('be.enabled');
});
