describe(__filename, () => {
  Cypress.env('chainId', '8453');
  Cypress.env('preset', 'andromeda');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '522433293696');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `wss://base-mainnet.infura.io/ws/v3/${Cypress.env('INFURA_KEY')}`,
      block: '22946353',
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
    cy.getUSDC({ amount: 1000 });

    cy.visit(
      `/#/positions/stataUSDC/1?manageAction=undelegate&accountId=${Cypress.env('accountId')}`
    );

    cy.get('[data-cy="unlock collateral form"]').should('exist');
    cy.get('[data-cy="locked amount"]').should('exist').and('include.text', 'Max');

    cy.get('[data-cy="undelegate amount input"]').should('exist');
    cy.get('[data-cy="undelegate amount input"]').type('1');
    cy.get('[data-cy="undelegate submit"]').should('be.enabled');
    cy.get('[data-cy="undelegate submit"]').click();

    cy.get('[data-cy="undelegate multistep"]')
      .should('exist')
      .and('include.text', '1 Static aUSDC will be unlocked from the pool.');

    cy.get('[data-cy="undelegate confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="undelegate confirm button"]').click();

    cy.contains('[data-status="error"]', 'Unlock collateral failed').should('exist');
    cy.contains('[data-status="error"]', 'MinDelegationTimeoutPending').should('exist');

    cy.contains('[data-status="success"]', 'Your locked collateral amount has been updated.', {
      timeout: 180_000,
    }).should('exist');
  });
});
