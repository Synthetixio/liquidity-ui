import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '8453');
  Cypress.env('preset', 'andromeda');
  Cypress.env('walletAddress', '0xdf29b49ede0289ba00a507e900552c46deed0dac');
  Cypress.env('accountId', '69');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `https://base-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      //      block: '22544990',
      block: '23559352',
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
        collateralSymbol: 'stataUSDC',
        poolId: 1,
        manageAction: 'deposit',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="claim rewards submit"]', { timeout: 180_000 }).should('be.enabled');
    cy.get('[data-cy="claim rewards submit"]').click();

    cy.get('[data-cy="claim rewards dialog"]').should('exist');

    cy.get('[data-cy="claim rewards info"]')
      .should('exist')
      .and('include.text', 'Claiming 0.016 USDC')
      .and('include.text', 'Claiming 0.013 SNX');

    cy.get('[data-cy="claim rewards info"]', { timeout: 180_000 })
      .should('include.text', 'Claimed 0.016 USDC')
      .and('include.text', 'Claimed 0.013 SNX');

    cy.contains('[data-status="success"]', 'Your rewards have been claimed').should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.contains('[data-cy="claim rewards dialog"] button', 'Done').click();
    cy.get('[data-cy="synths table"]').should('include.text', 'You do not have any synths');
  });
});
