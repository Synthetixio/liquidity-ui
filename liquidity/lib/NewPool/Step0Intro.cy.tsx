import { Box } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import injectedModule from '@web3-onboard/injected-wallets';
import { init } from '@web3-onboard/react';
import React from 'react';
import { Step0Intro } from './Step0Intro';

it(`${import.meta.url.split('/').pop()}`, () => {
  const queryClient = new QueryClient();
  init({ wallets: [injectedModule()], chains: [{ id: 1 }] });

  localStorage.setItem('chakra-ui-color-mode', 'dark');

  cy.mount(
    <QueryClientProvider client={queryClient}>
      <Box p={3} data-cy="Step0Intro">
        <Step0Intro onConfirm={() => {}} onClose={() => {}} />
      </Box>
    </QueryClientProvider>
  );

  cy.get('[data-cy="Step0Intro"]').should('include.text', 'Debt-free Staking is now live!');

  cy.get('[data-cy="Step0Intro"]').should(
    'include.text',
    'Learn more about Delegated Staking and the Jubilee Pool'
  );

  cy.contains('[data-cy="Step0Intro"] button', 'Start Migration').should('be.enabled');
  cy.contains('[data-cy="Step0Intro"] button', 'Later').should('be.enabled');
});
