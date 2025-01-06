import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '1');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xB9b8EF61b7851276B0239757A039d54a23804CBb');
  Cypress.env('accountId', '475474317634');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `https://mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '21233424',
    }).then(() => cy.log('Anvil started'));
    cy.pythBypass();

    cy.on('window:before:load', (win) => {
      win.localStorage.setItem('MAGIC_WALLET', Cypress.env('walletAddress'));
      win.localStorage.setItem(
        'DEFAULT_NETWORK',
        `${Cypress.env('chainId')}-${Cypress.env('preset')}`
      );
    });
  });
  afterEach(() => cy.task('stopAnvil').then(() => cy.log('Anvil stopped')));

  it(__filename, () => {
    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'SNX',
        manageAction: 'deposit',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="locked amount"]')
      .should('exist')
      .and('include.text', 'Escrowed 11.22 SNX');

    cy.get('[data-cy="locked amount link"]').should('exist').click();

    cy.get('[data-cy="locked collateral table"]').should('exist');
  });
});
