describe(__filename, () => {
  Cypress.env('chainId', '8453');
  Cypress.env('preset', 'andromeda');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '522433293696');

  beforeEach(() => {
    cy.on('window:before:load', (win) => {
      win.localStorage.setItem(
        'DEFAULT_NETWORK',
        `${Cypress.env('chainId')}-${Cypress.env('preset')}`
      );
    });
  });

  it(__filename, () => {
    cy.visit('?');

    cy.contains('[data-cy="connect wallet button"]', 'Connect Wallet').should('exist');
    cy.get('[data-cy="stats box"][data-title="Total Locked"]').should('exist');
    cy.get('[data-cy="stats box"][data-title="Total PNL"]').should('exist');

    cy.contains('h2', 'Positions').should('exist');
    cy.contains('p', 'Please connect wallet to view active positions').should('exist');
  });
});
