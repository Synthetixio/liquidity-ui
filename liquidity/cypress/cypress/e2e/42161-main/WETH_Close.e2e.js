import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '58655818123');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `wss://arbitrum-mainnet.infura.io/ws/v3/${Cypress.env('INFURA_KEY')}`,
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
    cy.delegateCollateral({ symbol: 'WETH', amount: 1, poolId: 1 });
    cy.borrowUsd({ symbol: 'WETH', amount: 100, poolId: 1 });
    cy.getSystemToken({ amount: 500 });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'WETH',
        poolId: 1,
        manageAction: 'close',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="debt amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');
    cy.get('[data-cy="locked collateral amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="close position multistep"]')
      .should('exist')
      .and('include.text', 'Repay Debt')
      .and('include.text', 'Unlock Collateral');

    cy.get('[data-cy="close position submit"]').should('exist').click();

    cy.get('[data-cy="close position multistep"]').should('exist');

    cy.get('[data-cy="close position confirm button"]').should('exist').click();

    cy.contains('[data-status="success"]', 'Position successfully Closed', {
      timeout: 180_000,
    }).should('exist');
  });
});
