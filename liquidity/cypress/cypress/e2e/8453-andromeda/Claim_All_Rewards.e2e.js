import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '8453');
  Cypress.env('preset', 'andromeda');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '522433293696');

  // Account with old vault rewards
  //  Cypress.env('walletAddress', '0x1a245Fa866932731631E1ec8EDcDbB0C6A402559');
  //  Cypress.env('accountId', '1640332659');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `https://base-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '23771246',
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

    cy.get('[data-cy="claim rewards dialog"]').should('exist');

    cy.get('[data-cy="claim rewards info"]')
      .should('exist')
      .and('include.text', 'Claiming 2.37 USDC')
      .and('include.text', 'Claiming 1.9 SNX');

    cy.contains('[data-status="success"]', 'Your rewards have been claimed', {
      timeout: 180_000,
    }).should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.get('[data-cy="claim rewards info"]')
      .should('include.text', 'Claimed 2.37 USDC')
      .and('include.text', 'Claimed 1.9 SNX');

    cy.contains('[data-cy="claim rewards dialog"] button', 'Done').click();
    cy.get('[data-cy="rewards table"]', { timeout: 180_000 }).should(
      'include.text',
      'No Rewards Available'
    );
    cy.get('[data-cy="claim rewards submit"]').should('be.disabled');
  });
});
