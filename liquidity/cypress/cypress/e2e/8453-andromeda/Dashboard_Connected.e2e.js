describe('Dashboard - Connected', () => {
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

    cy.visit('/#/dashboard');

    cy.get('[data-cy="short wallet address"]').contains(
      `${Cypress.env('walletAddress').substring(0, 6)}...${Cypress.env('walletAddress').substring(
        Cypress.env('walletAddress').length - 4
      )}`
    );

    cy.contains('h2', 'Dashboard').should('exist');
    cy.get('[data-cy="stats box"][data-title="Available to Lock"]').contains('$0.00');
    cy.get('[data-cy="stats box"][data-title="Total Locked"]').contains('$0.00');
    cy.get('[data-cy="stats box"][data-title="Total PNL"]').contains('$0.00');

    cy.contains('h2', 'Positions').should('exist');
    cy.get('[data-cy="all pools button"]').should('exist');
  });
});