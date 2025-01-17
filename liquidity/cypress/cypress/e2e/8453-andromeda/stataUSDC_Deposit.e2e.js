import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '8453');
  Cypress.env('preset', 'andromeda');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '522433293696');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl:
        Cypress.env('RPC_BASE_MAINNET') ??
        `https://base-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '25160443',
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
        collateralSymbol: 'stataUSDC',
        manageAction: 'deposit',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="deposit and lock collateral form"]').should('exist');
    cy.get('[data-cy="balance amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '110 Static aUSDC');

    cy.get('[data-cy="stats pnl"] [data-cy="change stats new"]').should('not.exist');
    cy.get('[data-cy="stats pnl"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '$0.48');

    cy.get('[data-cy="deposit amount input"]').should('exist');
    cy.get('[data-cy="deposit amount input"]').type('5');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats new"]')
      .should('exist')
      .and('include.text', '114.66 Static aUSDC'); // Adjusted per stata rate

    cy.get('[data-cy="deposit submit"]').should('be.enabled');
    cy.get('[data-cy="deposit submit"]').click();

    cy.get('[data-cy="deposit multistep"]')
      .should('exist')
      .and('include.text', 'Manage Collateral')
      .and('include.text', 'Approve USDC')
      .and('include.text', 'Approve spending of 5 USDC.')
      .and('include.text', 'Deposit and Lock USDC')
      .and('include.text', 'Approve update position on behalf')
      .and('include.text', 'Deposit and lock 5 USDC.');

    cy.get('[data-cy="deposit confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="deposit confirm button"]').click();

    cy.contains('[data-status="success"]', 'Your locked collateral amount has been updated.', {
      timeout: 180_000,
    }).should('exist');

    cy.contains('[data-cy="deposit multistep"] button', 'Done').click();

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]', {
      timeout: 180_000,
    }).and('include.text', '114.66 Static aUSDC');
    cy.get('[data-cy="deposit submit"]').should('be.disabled');
  });
});
