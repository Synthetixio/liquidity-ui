import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '58655818123');

  beforeEach(() => {
    cy.log(Cypress.env('provider'));

    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `https://arbitrum-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '271813668',
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
    cy.approveCollateral({ symbol: 'WETH', spender: 'CoreProxy' });
    cy.wrapEth({ amount: 20 });
    cy.depositCollateral({ symbol: 'WETH', amount: 10 });
    cy.delegateCollateral({ symbol: 'WETH', amount: 10, poolId: 1 });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'WETH',
        manageAction: 'claim',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="claim form"]', { timeout: 180_000 }).should('exist');
    cy.contains('[data-status="info"]', 'You can take an interest-free loan up to').should('exist');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '10 WETH');
    cy.get('[data-cy="stats debt"] [data-cy="change stats new"]').should('not.exist');
    cy.get('[data-cy="stats debt"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '-$0.0000098');

    cy.get('[data-cy="claim amount input"]').type('100');

    cy.get('[data-cy="stats debt"] [data-cy="change stats new"]')
      .should('exist')
      .and('include.text', '$100');

    cy.contains(
      '[data-status="warning"]',
      'Assets will be available to withdraw 24 hours after your last interaction with this position.'
    ).should('exist');

    cy.get('[data-cy="claim submit"]').should('be.enabled').and('include.text', 'Borrow');
    cy.get('[data-cy="claim submit"]').click();

    cy.get('[data-cy="claim multistep"]')
      .should('exist')
      .and('include.text', 'Manage Debt')
      .and('include.text', 'Borrow')
      .and('include.text', 'Borrow 100 USDx');

    cy.get('[data-cy="claim confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="claim confirm button"]').click();

    cy.contains('[data-status="success"]', 'Debt successfully Updated', {
      timeout: 180_000,
    }).should('exist');

    cy.get('[data-cy="stats debt"] [data-cy="change stats new"]').should('not.exist');
    cy.get('[data-cy="stats debt"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '$100');
  });
});
