import { generatePath } from 'react-router-dom';

it('should repay borrowed USDx', () => {
  cy.connectWallet().then(({ address, privateKey }) => {
    cy.task('setEthBalance', { address, balance: 105 });

    cy.task('approveCollateral', { privateKey: privateKey, symbol: 'WETH' });
    cy.task('wrapEth', { privateKey: privateKey, amount: 20 });

    cy.task('createAccount', { privateKey }).then((accountId) => {
      cy.wrap(accountId).as('accountId');
      cy.task('depositCollateral', {
        privateKey,
        symbol: 'WETH',
        accountId,
        amount: 10,
      });
      cy.task('delegateCollateral', {
        privateKey,
        symbol: 'WETH',
        accountId,
        amount: 10,
        poolId: 1,
      });
      cy.task('borrowUsd', {
        privateKey,
        symbol: 'WETH',
        accountId,
        amount: 10,
        poolId: 1,
      }).then((debt) => cy.wrap(debt).as('debt'));
    });
  });
  cy.viewport(1000, 800);

  cy.get('@accountId').then((accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'WETH',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=repay&accountId=${accountId}`);
  });

  cy.get('[data-cy="repay amount input"]').should('exist').type('5');

  cy.get('[data-cy="repay submit"]').should('be.enabled').click();

  cy.get('[data-cy="repay multistep"]')
    .should('exist')
    .and('include.text', 'Manage Debt')
    .and('include.text', 'Approve USDx transfer')
    .and('include.text', 'Repay')
    .and('include.text', 'Repay 5 USDx');

  cy.get('[data-cy="repay confirm button"]').should('include.text', 'Execute Transaction').click();
  cy.contains('[data-status="info"]', 'Debt successfully Updated').should('exist');
});
