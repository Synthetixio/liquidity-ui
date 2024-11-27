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

    cy.visit('/#/dashboard');

    cy.get('[data-cy="wallet button"]').click();
    cy.get('[data-cy="accounts list"]').children().should('have.length', 1);
    cy.contains('[data-cy="create new account button"]', 'Create Account')
      .should('exist')
      .and('be.visible')
      .and('be.enabled');
    cy.get('[data-cy="create new account button"]').click();
    cy.get('[data-cy="accounts list"]').children().should('have.length', 2);

    cy.url().then((url) => {
      const u1 = new URL(url);
      const u2 = new URL(`http://whatever${u1.hash.slice(1)}`);
      const urlAccountId = u2.searchParams.get('accountId');
      expect(urlAccountId).equal(Cypress.env('accountId'));
    });

    cy.get(`[data-cy="account id"][data-account-id="${Cypress.env('accountId')}"]`).should('exist');
  });
});
