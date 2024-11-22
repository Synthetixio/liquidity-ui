import { generatePath } from 'react-router-dom';

it('Manage SNX Position - Borrow', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('createAccount', { address, accountId });
    cy.task('approveCollateral', { address, symbol: 'SNX' });
    cy.task('getSnx', { address, amount: 2000 });
    cy.task('depositCollateral', {
      address,
      symbol: 'SNX',
      accountId,
      amount: 150,
    });
    cy.task('delegateCollateral', {
      address,
      symbol: 'SNX',
      accountId,
      amount: 150,
      poolId: 1,
    });
  });

  cy.viewport(1000, 1200);

  cy.get('@accountId').then((accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'SNX',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=borrow&accountId=${accountId}`);
  });

  // Temporary fix for URL to fully resolve accountId, until refactored
  cy.wait(5000);

  cy.get('[data-cy="borrow amount input"]').should('exist');
  cy.get('[data-cy="borrow amount input"]').type('10');

  cy.contains(
    '[data-status="warning"]',
    'As a security precaution, borrowed assets can only be withdrawn to your wallet after 24 hs since your previous account activity.'
  ).should('exist');

  cy.get('[data-cy="borrow submit"]').should('be.enabled');
  cy.get('[data-cy="borrow submit"]').click();

  cy.get('[data-cy="borrow multistep"]')
    .should('exist')
    .and('include.text', 'Manage Debt')
    .and('include.text', 'Borrow')
    .and('include.text', 'Borrow 10 sUSD');

  cy.get('[data-cy="borrow confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="borrow confirm button"]').click();

  cy.contains('[data-status="info"]', 'Debt successfully Updated').should('exist');
});
