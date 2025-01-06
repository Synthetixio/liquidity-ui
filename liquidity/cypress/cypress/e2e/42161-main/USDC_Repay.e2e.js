import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '58655818123');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl:
        Cypress.env('RPC_ARBITRUM_MAINNET') ??
        `https://arbitrum-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '291378200',
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
        collateralSymbol: 'USDC',
        manageAction: 'repay',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="repay debt form"]').should('exist');
    cy.get('[data-cy="current debt amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '100 USDC');
    cy.get('[data-cy="stats debt"] [data-cy="change stats new"]').should('not.exist');
    cy.get('[data-cy="stats debt"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '$4.092');

    cy.get('[data-cy="repay amount input"]').type('2');

    cy.get('[data-cy="stats debt"] [data-cy="change stats new"]')
      .should('exist')
      .and('include.text', '$2.092');

    cy.get('[data-cy="repay submit"]').should('be.enabled');
    cy.get('[data-cy="repay submit"]').click();

    cy.get('[data-cy="repay dialog"]')
      .should('exist')
      .and('include.text', 'Repaying Debt')
      .and('include.text', 'Repaying 2 USDx');

    cy.contains('[data-status="success"]', 'Your debt has been repaid', {
      timeout: 180_000,
    }).should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.get('[data-cy="repay dialog"]').should('exist').and('include.text', 'Repaid 2 USDx');

    cy.contains('[data-cy="repay dialog"] button', 'Done').click();

    cy.get('[data-cy="stats debt"] [data-cy="change stats current"]', { timeout: 180_000 }).and(
      'include.text',
      '$2.092'
    );

    cy.get('[data-cy="repay submit"]').should('be.disabled');
  });
});
