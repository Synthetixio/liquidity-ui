import { generatePath } from 'react-router-dom';

it('should be able to unlock USDC collateral after depositing', () => {
  cy.connectWallet().then(({ address, privateKey }) => {
    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('getUSDC', { address: address, amount: 1000 });
    cy.task('wrapCollateral', { privateKey, symbol: 'USDC', amount: 500 });
    cy.task('approveCollateral', { privateKey: privateKey, symbol: 'sUSDC' });
    cy.task('createAccount', { privateKey }).then((accountId) => {
      cy.wrap(accountId).as('accountId');

      cy.task('depositCollateral', {
        privateKey,
        symbol: 'sUSDC',
        accountId,
        amount: 150,
      });

      cy.task('delegateCollateral', {
        privateKey,
        symbol: 'sUSDC',
        accountId,
        amount: 150,
        poolId: 1,
      });
    });
  });

  cy.get('@accountId').then(async (accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'USDC',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=undelegate&accountId=${accountId}`);
  });

  cy.get('[data-cy="undelegate amount input"]').should('exist').type('30');
  cy.get('[data-cy="undelegate submit"]').should('be.enabled').click();

  cy.get('[data-cy="undelegate confirm button"]')
    .should('include.text', 'Execute Transaction')
    .click();

  cy.wait(3000);
  cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '120 USDC');
});
