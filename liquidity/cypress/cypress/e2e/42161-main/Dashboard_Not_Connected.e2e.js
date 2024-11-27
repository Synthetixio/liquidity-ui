describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '58655818123');

  beforeEach(() => {
    cy.on('window:before:load', (win) => {
      win.localStorage.setItem(
        'DEFAULT_NETWORK',
        `${Cypress.env('chainId')}-${Cypress.env('preset')}`
      );
    });
  });

  it(__filename, () => {
    cy.visit('/#/dashboard');

    cy.contains('h2', 'Dashboard').should('exist');

    cy.contains('[data-cy="connect wallet button"]', 'Connect Wallet').should('exist');
    cy.contains(
      '[data-status="info"]',
      'Please connect your wallet to open, manage or view positions.'
    ).should('exist');
    cy.get('[data-cy="stats box"][data-title="Available to Lock"]').should('exist');
    cy.get('[data-cy="stats box"][data-title="Total Locked"]').should('exist');
    cy.get('[data-cy="stats box"][data-title="Total Debt"]').should('exist');

    cy.contains('h2', 'Positions').should('exist');
    cy.contains('p', 'Please connect wallet to view active positions').should('exist');
  });
});
