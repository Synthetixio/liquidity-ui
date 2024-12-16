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

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'WETH',
        manageAction: 'withdraw',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="withdraw form"]').should('exist');
    cy.get('[data-cy="withdraw amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="withdraw amount input"]').should('exist');
    cy.get('[data-cy="withdraw amount input"]').type('1');
    cy.get('[data-cy="withdraw submit"]').should('be.enabled');
    cy.get('[data-cy="withdraw submit"]').click();

    cy.get('[data-cy="withdraw multistep"]')
      .should('exist')
      .and('include.text', 'Manage Collateral')
      .and('include.text', 'Withdraw')
      .and('include.text', '1 WETH will be withdrawn');

    cy.get('[data-cy="withdraw confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="withdraw confirm button"]').click();

    cy.contains('[data-status="success"]', 'Collateral successfully Withdrawn', {
      timeout: 180_000,
    }).should('exist');
  });
});
