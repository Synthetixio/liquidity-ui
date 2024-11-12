describe('Manage SNX Position - Deposit', () => {
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
    cy.getSNX({ amount: 500 });

    cy.visit(`/#/positions/SNX/1?manageAction=deposit&accountId=${Cypress.env('accountId')}`);

    cy.get('[data-cy="deposit and lock collateral form"]').should('exist');
    cy.get('[data-cy="balance amount"]').should('exist').and('include.text', 'Max');

    cy.get('[data-cy="deposit amount input"]').type('101');
    cy.get('[data-cy="deposit submit"]').should('be.enabled');
    cy.get('[data-cy="deposit submit"]').click();

    cy.get('[data-cy="deposit multistep"]')
      .should('exist')
      .and('include.text', 'Approve SNX transfer')
      .and('include.text', 'Deposit and Lock SNX')
      .and('include.text', 'This will deposit and lock 101 SNX into Spartan Council Pool.');

    cy.get('[data-cy="deposit confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="deposit confirm button"]').click();

    cy.contains(
      '[data-status="success"]',
      'Your locked collateral amount has been updated.'
    ).should('exist');
  });
});