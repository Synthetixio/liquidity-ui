describe('Manage SNX Position - Borrow', () => {
  Cypress.env('chainId', '1');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '651583203448');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `wss://mainnet.infura.io/ws/v3/${Cypress.env('INFURA_KEY')}`,
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

  it('works', () => {
    cy.setEthBalance({ balance: 100 });
    cy.approveCollateral({ symbol: 'SNX', spender: 'CoreProxy' });
    cy.getSNX({ amount: 2000 });
    cy.depositCollateral({ symbol: 'SNX', amount: 150 });
    cy.delegateCollateral({ symbol: 'SNX', amount: 150, poolId: 1 });

    cy.visit(`/#/positions/SNX/1?manageAction=borrow&accountId=${Cypress.env('accountId')}`);

    cy.get('[data-cy="borrow form"]').should('exist');
    cy.get('[data-cy="borrow amount"]').should('exist').and('include.text', 'Max');

    cy.get('[data-cy="borrow amount input"]').should('exist');
    cy.get('[data-cy="borrow amount input"]').type('10');

    cy.contains(
      '[data-status="warning"]',
      'As a security precaution, borrowed assets can only be withdrawn to your wallet after 24 hs since your previous account activity.'
    ).should('exist');

    cy.get('[data-cy="borrow submit"]').should('be.enabled');
    cy.get('[data-cy="borrow submit"]').click();

    cy.get('[data-cy="borrow multistep"]')
      .should('exist')
      .and('include.text', 'Manage Debt')
      .and('include.text', 'Borrow')
      .and('include.text', 'Borrow 10 sUSD');

    cy.get('[data-cy="borrow confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="borrow confirm button"]').click();

    cy.contains('[data-status="success"]', 'Debt successfully Updated', {
      timeout: 180_000,
    }).should('exist');
  });
});
