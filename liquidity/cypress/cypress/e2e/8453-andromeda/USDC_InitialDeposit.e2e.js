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
      block: '26590448',
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

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'USDC',
        manageAction: 'deposit',
      })}`
    );

    cy.get('[data-cy="deposit and lock collateral form"]').should('exist');
    cy.get('[data-cy="balance amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '0 USDC');
    cy.get('[data-cy="stats collateral"] [data-cy="change stats new"]').should('not.exist');

    cy.get('[data-cy="deposit amount input"]').should('exist');
    cy.get('[data-cy="deposit amount input"]').type('500');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats new"]')
      .should('exist')
      .and('include.text', '500 USDC');

    cy.get('[data-cy="deposit submit"]').should('be.enabled');
    cy.get('[data-cy="deposit submit"]').click();

    cy.get('[data-cy="deposit multistep"]')
      .should('exist')
      .and('include.text', 'Open Liquidity Position')
      .and('include.text', 'Approve USDC')
      .and('include.text', 'Approve spending of 500 USDC.')
      .and('include.text', 'Deposit and Lock USDC')
      .and('include.text', 'Create new account')
      .and('include.text', 'Deposit and lock 500 USDC.');

    cy.get('[data-cy="deposit confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="deposit confirm button"]').click();

    cy.contains('[data-status="success"]', 'Your locked collateral amount has been updated.', {
      timeout: 180_000,
    }).should('exist');

    cy.contains('[data-cy="deposit multistep"] button', 'Done').click();

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]', {
      timeout: 60_000,
    }).and('include.text', '500 USDC');
    cy.get('[data-cy="deposit submit"]').should('be.disabled');
  });
});
