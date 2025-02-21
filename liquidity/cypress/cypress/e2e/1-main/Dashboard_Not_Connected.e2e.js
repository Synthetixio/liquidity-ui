describe(__filename, () => {
  Cypress.env('chainId', '1');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '651583203448');

  beforeEach(() => {
    cy.on('window:before:load', (win) => {
      win.localStorage.setItem(
        'DEFAULT_NETWORK',
        `${Cypress.env('chainId')}-${Cypress.env('preset')}`
      );
    });
  });

  it(__filename, () => {
    cy.visit('/');

    cy.contains('[data-cy="connect wallet button"]', 'Connect Wallet').should('exist');

    cy.contains('h2', 'Positions').should('exist');
    cy.contains('p', 'Please connect wallet to view active positions').should('exist');
  });
});
