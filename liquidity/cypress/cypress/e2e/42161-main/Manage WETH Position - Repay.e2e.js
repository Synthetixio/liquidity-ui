import { generatePath } from 'react-router-dom';

it('Manage WETH Position - Repay', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 105 });
    cy.task('createAccount', { address, accountId });

    cy.task('approveCollateral', { address, symbol: 'WETH' });
    cy.task('wrapEth', { address, amount: 20 });

    cy.task('depositCollateral', {
      address,
      symbol: 'WETH',
      accountId,
      amount: 10,
    });
    cy.task('delegateCollateral', {
      address,
      symbol: 'WETH',
      accountId,
      amount: 10,
      poolId: 1,
    });
    cy.task('borrowUsd', {
      address,
      symbol: 'WETH',
      accountId,
      amount: 100,
      poolId: 1,
    }).then((debt) => cy.wrap(debt).as('debt'));
  });

  cy.viewport(1000, 1200);

  cy.get('@accountId').then((accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'WETH',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=repay&accountId=${accountId}`);
  });

  // Temporary fix for URL to fully resolve accountId, until refactored
  cy.wait(5000);

  cy.get('[data-cy="repay amount input"]').type('5');

  cy.get('[data-cy="repay submit"]').should('be.enabled');
  cy.get('[data-cy="repay submit"]').click();

  cy.get('[data-cy="repay multistep"]')
    .should('exist')
    .and('include.text', 'Manage Debt')
    .and('include.text', 'Approve USDx transfer')
    .and('include.text', 'Repay')
    .and('include.text', 'Repay 5 USDx');

  cy.get('[data-cy="repay confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="repay confirm button"]').click();
  cy.contains('[data-status="success"]', 'Your debt has been repaid.').should('exist');
  cy.contains('[data-status="info"]', 'Debt successfully Updated').should('exist');
});
