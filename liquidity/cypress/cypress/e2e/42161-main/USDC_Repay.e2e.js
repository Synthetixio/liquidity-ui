import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '58655818123');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `https://arbitrum-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '285187379',
    }).then(() => cy.log('Anvil started'));

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
        collateralSymbol: 'USDC',
        manageAction: 'repay',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="repay debt form"]').should('exist');
    cy.get('[data-cy="current debt amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.contains('[data-cy="current debt amount"] span', 'Max').click();

    cy.get('[data-cy="repay submit"]').should('be.enabled');
    cy.get('[data-cy="repay submit"]').click();

    cy.get('[data-cy="repay multistep"]')
      .should('exist')
      .and('include.text', 'Manage Debt')
      .and('include.text', 'Approve USDx transfer')
      .and('include.text', 'Repay')
      .and('include.text', 'Repay 1.2 USDx');

    cy.get('[data-cy="repay confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="repay confirm button"]').click();
    cy.contains('[data-status="success"]', 'Your debt has been repaid.').should('exist');

    cy.contains('[data-status="success"]', 'Debt successfully Updated', {
      timeout: 180_000,
    }).should('exist');
  });
});
