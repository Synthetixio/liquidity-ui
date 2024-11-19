import { generatePath } from 'react-router-dom';

it('Manage WETH Position - Deposit', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('createAccount', { address, accountId });
  });

  cy.viewport(1000, 1200);

  cy.get('@accountId').then((accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'WETH',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=deposit&accountId=${accountId}`);
  });

  cy.get('[data-cy="balance amount"]').should('exist').and('include.text', 'Max');
  cy.get('[data-cy="deposit amount input"]').type('1');
  cy.get('[data-cy="deposit submit"]').should('be.enabled');
  cy.get('[data-cy="deposit submit"]').click();

  cy.get('[data-cy="deposit multistep"]')
    .should('exist')
    .and('include.text', 'Manage Collateral')
    .and('include.text', 'Approve WETH transfer')
    .and('include.text', 'Deposit & Lock WETH')
    .and('include.text', 'This will deposit and lock 1 WETH to Spartan Council Pool.');

  cy.get('[data-cy="deposit confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="deposit confirm button"]').click();

  cy.contains('[data-status="success"]', 'Your locked collateral amount has been updated.').should(
    'exist'
  );

  // TODO: Enable additional deposit after fixing an issue with balance refetching
  //  cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '1 WETH');
  //
  //  cy.get('@wallet').then(async (address) => {
  //    cy.task('setEthBalance', { address, balance: 100 });
  //  });
  //  cy.get('[data-cy="balance amount"]').should('exist').and('include.text', 'Max');
  //  cy.get('[data-cy="deposit amount input"]').clear();
  //  cy.get('[data-cy="deposit amount input"]').type('0.69');
  //  cy.get('[data-cy="deposit submit"]').should('be.enabled');
  //  cy.get('[data-cy="deposit submit"]').click();
  //
  //  cy.get('[data-cy="deposit multistep"]')
  //    .should('exist')
  //    .and('include.text', 'Manage Collateral')
  //    .and('include.text', 'Approve WETH transfer')
  //    .and('include.text', 'Deposit & Lock WETH')
  //    .and('include.text', 'This will deposit and lock 0.69 WETH to Spartan Council Pool.');
  //
  //  cy.get('[data-cy="deposit confirm button"]')
  //    .should('include.text', 'Execute Transaction')
  //    .click();
  //
  //  cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '1.69 WETH');
});
