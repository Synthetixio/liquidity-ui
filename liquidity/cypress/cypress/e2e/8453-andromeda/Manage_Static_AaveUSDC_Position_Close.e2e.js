describe('Manage Static AaveUSDC Position - Close Position', () => {
  Cypress.env('chainId', '8453');
  Cypress.env('preset', 'andromeda');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '522433293696');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `wss://base-mainnet.infura.io/ws/v3/${Cypress.env('INFURA_KEY')}`,
      block: '22683522',
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
    cy.getUSDC({ amount: 1000 });

    cy.visit(`/#/positions/stataUSDC/1?manageAction=deposit&accountId=${Cypress.env('accountId')}`);

    cy.get('[data-cy="close position"]').should('exist').click();

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
