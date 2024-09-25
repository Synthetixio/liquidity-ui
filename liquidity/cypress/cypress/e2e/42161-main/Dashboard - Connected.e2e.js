it('Dashboard - Connected', () => {
  cy.connectWallet().then(({ address, privateKey }) => {
    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('createAccount', { privateKey }).then((accountId) => {
      cy.wrap(accountId).as('accountId');
    });
  });

  cy.viewport(1200, 900);
  cy.visit('/#/dashboard');

  cy.get('@wallet').then(({ address }) => {
    cy.get('[data-cy="short wallet address"]').contains(
      `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    );
  });

  cy.contains('h2', 'Dashboard').should('exist');
  cy.get('[data-cy="stats box"][data-title="Available to Lock"]').contains('$0.00');
  cy.get('[data-cy="stats box"][data-title="Total Locked"]').contains('$0.00');
  cy.get('[data-cy="stats box"][data-title="Total Debt"]').contains('$0.00');

  cy.contains('h2', 'Positions').should('exist');
  cy.get('[data-cy="all pools button"]').should('exist');
});
