import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '8453');
  Cypress.env('preset', 'andromeda');
  Cypress.env('walletAddress', '0xaaaa6c341C4Df916d9f0583Ba9Ea953618e5f008');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl:
        Cypress.env('RPC_BASE_MAINNET') ??
        `https://base-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '26827400',
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
    cy.getUSDC({ amount: 1000 });
    cy.pmSetupPosition({ symbol: 'USDC', amount: 500 });
    cy.pmDecreasePosition({ symbol: 'USDC', amount: 100 });
    cy.getSystemToken({ amount: 1000 });
    cy.depositSystemToken({ amount: 50 });
    cy.setWithdrawTimeout({ timeout: '0' });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'USDC',
        manageAction: 'withdraw',
      })}`
    );

    cy.get('[data-cy="withdraw form"]').should('exist');
    cy.get('[data-cy="withdraw amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Unlocked: 150 USDC');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '400 USDC');

    cy.get('[data-cy="withdraw amount input"]').should('exist');
    cy.get('[data-cy="withdraw amount input"]').should('have.value', 150);

    cy.get('[data-cy="withdraw submit"]').should('be.enabled');
    cy.get('[data-cy="withdraw submit"]').click();

    cy.get('[data-cy="withdraw dialog"]')
      .should('exist')
      .and('include.text', 'Withdrawing USDC')
      .and('include.text', 'Withdrawing 150 USDC');

    cy.contains('[data-status="success"]', 'Withdrawal was successful', {
      timeout: 180_000,
    }).should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.get('[data-cy="withdraw dialog"]')
      .should('exist')
      .and('include.text', 'Withdrawing USDC')
      .and('include.text', 'Withdrew 150 USDC');

    cy.contains('[data-cy="withdraw dialog"] button', 'Done').click();

    cy.get('[data-cy="withdraw amount"]')
      .should('exist')
      .and('include.text', 'Unlocked: 0.00 USDC');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]').and(
      'include.text',
      '400 USDC'
    );
    cy.get('[data-cy="withdraw submit"]').should('be.disabled');
  });
});
