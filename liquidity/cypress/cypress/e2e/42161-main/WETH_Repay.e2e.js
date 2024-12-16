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
    cy.borrowUsd({ symbol: 'WETH', amount: 100, poolId: 1 });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'WETH',
        manageAction: 'repay',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="repay debt form"]').should('exist');
    cy.get('[data-cy="current debt amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="repay amount input"]').type('5');

    cy.get('[data-cy="repay submit"]').should('be.enabled');
    cy.get('[data-cy="repay submit"]').click();

    cy.get('[data-cy="repay multistep"]')
      .should('exist')
      .and('include.text', 'Manage Debt')
      .and('include.text', 'Approve USDx transfer')
      .and('include.text', 'Repay')
      .and('include.text', 'Repay 5 USDx');

    cy.get('[data-cy="repay confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="repay confirm button"]').click();
    cy.contains('[data-status="success"]', 'Your debt has been repaid.').should('exist');

    cy.contains('[data-status="success"]', 'Debt successfully Updated', {
      timeout: 180_000,
    }).should('exist');
  });
});
