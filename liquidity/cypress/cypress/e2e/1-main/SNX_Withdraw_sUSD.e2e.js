import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '1');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '651583203448');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `https://mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '21233424',
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
    cy.getSNX({ amount: 2000 });
    cy.approveCollateral({ symbol: 'SNX', spender: 'CoreProxy' });
    cy.depositCollateral({ symbol: 'SNX', amount: 100 });
    cy.delegateCollateral({ symbol: 'SNX', amount: 100, poolId: 1 });
    cy.borrowUsd({ symbol: 'SNX', amount: 10, poolId: 1 });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'SNX',
        poolId: 1,
        manageAction: 'withdraw-debt',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="withdraw form"]').should('exist');
    cy.get('[data-cy="withdraw amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="withdraw amount input"]').should('exist');
    cy.get('[data-cy="withdraw amount input"]').type('5');
    cy.get('[data-cy="withdraw submit"]').should('be.enabled');
    cy.get('[data-cy="withdraw submit"]').click();

    cy.get('[data-cy="withdraw multistep"]')
      .should('exist')
      .and('include.text', 'Manage Debt')
      .and('include.text', 'Withdraw')
      .and('include.text', '5 sUSD will be withdrawn');

    cy.get('[data-cy="withdraw confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="withdraw confirm button"]').click();

    cy.contains('[data-status="error"]', 'Withdraw failed').should('exist');
    cy.contains('[data-status="error"]', 'AccountActivityTimeoutPending').should('exist');
    cy.get('[data-status="error"] [aria-label="Close"]').click();

    cy.setWithdrawTimeout({ timeout: '0' });

    cy.get('[data-cy="withdraw confirm button"]').should('include.text', 'Retry');
    cy.get('[data-cy="withdraw confirm button"]').click();

    cy.contains('[data-status="success"]', 'Debt successfully Withdrawn', {
      timeout: 180_000,
    }).should('exist');
  });
});
