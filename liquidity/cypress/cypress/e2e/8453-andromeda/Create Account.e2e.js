it('Create Account', () => {
  cy.connectWallet().then((wallet) => {
    cy.task('setEthBalance', { address: wallet.address, balance: 2 });
  });

  cy.viewport(1200, 900);
  cy.visit('/#/dashboard');

  cy.get('[data-cy="wallet button"]').click();
  cy.contains('[data-cy="create new account button"]', 'Create Account').should('exist');
  cy.get('[data-cy="create new account button"]').click();
  cy.get('[data-cy="accounts list"]').children().should('have.length', 1);

  cy.url().then((url) => {
    const u1 = new URL(url);
    const u2 = new URL(`http://whatever${u1.hash.slice(1)}`);
    const accountId = u2.searchParams.get('accountId');
    cy.get(`[data-cy="account id"][data-account-id="${accountId}"]`).should('exist');
  });
});
