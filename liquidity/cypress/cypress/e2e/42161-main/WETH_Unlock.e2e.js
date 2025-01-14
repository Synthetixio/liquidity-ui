import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '58655818123');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl:
        Cypress.env('RPC_ARBITRUM_MAINNET') ??
        `https://arbitrum-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '271813668',
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
    cy.approveCollateral({ symbol: 'WETH', spender: 'CoreProxy' });
    cy.wrapEth({ amount: 20 });
    cy.depositCollateral({ symbol: 'WETH', amount: 10 });
    cy.delegateCollateral({ symbol: 'WETH', amount: 1, poolId: 1 });
    cy.getSystemToken({ amount: 500 });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'WETH',
        manageAction: 'undelegate',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="undelegate collateral form"]').should('exist');
    cy.get('[data-cy="locked amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="undelegate amount input"]').should('exist');
    cy.get('[data-cy="undelegate amount input"]').type('0.5');
    cy.get('[data-cy="undelegate submit"]').should('be.enabled');
    cy.get('[data-cy="undelegate submit"]').click();

    cy.get('[data-cy="undelegate dialog"]')
      .should('exist')
      .and('include.text', 'Unlocking Collateral')
      .and('include.text', 'Unlocking 0.5 WETH');

    cy.contains('[data-status="success"]', 'Your collateral has been updated', {
      timeout: 180_000,
    }).should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.get('[data-cy="undelegate dialog"]').should('exist').and('include.text', 'Unlocked 0.5 WETH');

    cy.contains('[data-cy="undelegate dialog"] button', 'Done').click();

    cy.get('[data-cy="undelegate submit"]').should('be.disabled');
  });
});
