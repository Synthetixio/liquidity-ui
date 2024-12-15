import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xeEBb1b80e75b44180EbF7893DA00034d30BDfF7C');
  Cypress.env('accountId', '170141183460469231731687303715884106023');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `https://arbitrum-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '281318272',
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
    cy.setEthBalance({ balance: 100 });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'ARB',
        poolId: 1,
        manageAction: 'deposit',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="claim rewards submit"]', { timeout: 180_000 }).should('be.enabled');
    cy.get('[data-cy="claim rewards submit"]').click();

    cy.get('[data-cy="claim rewards info"]')
      .should('exist')
      .and('include.text', 'Claiming 53.87 ARB')
      .and('include.text', 'Claiming 0.55 USDe')
      .and('include.text', 'Claiming 0.0078 WETH')
      .and('include.text', 'Claiming 0.0000004 tBTC');

    cy.get('[data-cy="claim rewards info"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Claimed 53.87 ARB')
      .and('include.text', 'Claimed 0.55 USDe')
      .and('include.text', 'Claimed 0.0078 WETH')
      .and('include.text', 'Claimed 0.0000004 tBTC');

    cy.contains('[data-status="success"]', 'Your rewards have been claimed').should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.contains('[data-cy="claim rewards dialog"] button', 'Done').click();
    cy.get('[data-cy="rewards table"]').should('include.text', 'No Rewards Available');
    cy.get('[data-cy="claim rewards submit"]').should('be.disabled');
  });
});
