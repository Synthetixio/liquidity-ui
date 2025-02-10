import { Box } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import injectedModule from '@web3-onboard/injected-wallets';
import { init } from '@web3-onboard/react';
import React from 'react';
import { Step1Explain } from './Step1Explain';
import { ethers } from 'ethers';

it(`${import.meta.url.split('/').pop()}`, () => {
  const queryClient = new QueryClient();
  init({ wallets: [injectedModule()], chains: [{ id: 1 }] });

  localStorage.setItem('chakra-ui-color-mode', 'dark');

  queryClient.setQueryData(
    ['undefined-undefined', 'New Pool', 'targetCRatio', { contractsHash: '~' }],
    ethers.utils.parseEther('2')
  );

  cy.mount(
    <QueryClientProvider client={queryClient}>
      <Box p={3} data-cy="Step1Explain">
        <Step1Explain onConfirm={() => {}} onClose={() => {}} />
      </Box>
    </QueryClientProvider>
  );

  cy.get('[data-cy="Step1Explain"]').should(
    'include.text',
    'Migrating to Delegated Staking consists of:'
  );

  cy.get('[data-cy="Step1Explain"]').should(
    'include.text',
    'Migration to the Jubilee Pool requires a C-Ratio of >200%. If you are below 200%, you must repay your debt before migration.'
  );

  cy.contains('[data-cy="Step1Explain"] button', 'Continue').should('be.enabled');
  cy.contains('[data-cy="Step1Explain"] button', 'Back').should('be.enabled');
});
