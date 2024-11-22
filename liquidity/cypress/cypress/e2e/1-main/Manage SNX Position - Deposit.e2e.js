import { generatePath } from 'react-router-dom';

it('Manage SNX Position - Deposit', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('getSnx', { address, amount: 500 });
    cy.task('createAccount', { address, accountId });
  });

  cy.viewport(1000, 1200);

  cy.get('@accountId').then((accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'SNX',
      poolId: 1,
    });

    cy.visit(`/#${path}?manageAction=deposit&accountId=${accountId}`);
  });

  // Temporary fix for URL to fully resolve accountId, until refactored
  cy.wait(5000);

  cy.get('[data-cy="balance amount"]').should('exist').and('include.text', 'Max');
  cy.get('[data-cy="deposit amount input"]').type('101');
  cy.get('[data-cy="deposit submit"]').should('be.enabled');
  cy.get('[data-cy="deposit submit"]').click();

  cy.get('[data-cy="deposit multistep"]')
    .should('exist')
    .and('include.text', 'Approve SNX transfer')
    .and('include.text', 'Deposit and Lock SNX')
    .and('include.text', 'This will deposit and lock 101 SNX into Spartan Council Pool.');

  cy.get('[data-cy="deposit confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="deposit confirm button"]').click();

  cy.contains('[data-status="success"]', 'Your locked collateral amount has been updated.').should(
    'exist'
  );
});
