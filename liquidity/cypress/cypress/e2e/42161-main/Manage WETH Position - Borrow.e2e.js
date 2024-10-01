import { generatePath } from 'react-router-dom';

it('should borrow against WETH position', () => {
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
    });
  });

  cy.viewport(1000, 800);

  cy.get('@accountId').then((accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'WETH',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=claim&accountId=${accountId}`);
  });

  cy.contains('[data-status="info"]', 'You can take an interest-free loan up to').should('exist');

  cy.get('[data-cy="claim amount input"]').should('exist').type('10');

  cy.contains(
    '[data-status="warning"]',
    'Assets will be available to withdraw 24 hours after your last interaction with this position.'
  ).should('exist');

  cy.contains('[data-status="info"]', 'You are about to take a $10 interest-free loan').should(
    'exist'
  );

  cy.get('[data-cy="claim submit"]').should('be.enabled').click();

  cy.get('[data-cy="claim multistep"]')
    .should('exist')
    .and('include.text', 'Manage Debt')
    .and('include.text', 'Borrow')
    .and('include.text', 'Borrow 10 USDx');

  cy.get('[data-cy="claim confirm button"]').should('include.text', 'Execute Transaction').click();

  cy.contains('[data-status="info"]', 'Debt successfully Updated').should('exist');
});
