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
      block: '285379110',
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
    cy.setEthBalance({ balance: 100 });

    cy.visit(
      `?${makeSearch({
        page: 'dashboard',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="claim rewards submit"]', { timeout: 180_000 }).should('be.enabled');
    cy.get('[data-cy="claim rewards submit"]').click();

    cy.get('[data-cy="claim rewards info"]')
      .should('exist')

      .and('include.text', 'Claiming 0.35 ARB')
      .and('include.text', 'Claiming 0.18 USDe')
      .and('include.text', 'Claiming 0.0012 WETH')
      .and('include.text', 'Claiming 0.000000071 tBTC');

    cy.contains('[data-status="success"]', 'Your rewards have been claimed', {
      timeout: 180_000,
    }).should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.get('[data-cy="claim rewards info"]')
      .should('exist')
      .and('include.text', 'Claimed 0.35 ARB')
      .and('include.text', 'Claimed 0.18 USDe')
      .and('include.text', 'Claimed 0.0012 WETH')
      .and('include.text', 'Claimed 0.000000071 tBTC');

    cy.contains('[data-cy="claim rewards dialog"] button', 'Done').click();
    cy.get('[data-cy="rewards table"]', { timeout: 180_000 }).should(
      'include.text',
      'No Rewards Available'
    );
    cy.get('[data-cy="claim rewards submit"]').should('be.disabled');
  });
});
