import { generatePath } from 'react-router-dom';

it('Manage SNX Position - Unlock', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('getSnx', { address: address, amount: 2000 });
    cy.task('approveCollateral', { address, symbol: 'SNX' });
    cy.task('createAccount', { address, accountId });

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

  cy.get('@accountId').then(async (accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'SNX',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=undelegate&accountId=${accountId}`);
  });

  // Temporary fix for URL to fully resolve accountId, until refactored
  cy.wait(5000);

  cy.get('[data-cy="undelegate amount input"]').should('exist');
  cy.get('[data-cy="undelegate amount input"]').type('30');
  cy.get('[data-cy="undelegate submit"]').should('be.enabled');
  cy.get('[data-cy="undelegate submit"]').click();

  cy.get('[data-cy="undelegate multistep"]')
    .should('exist')
    .and('include.text', '30 SNX will be unlocked from the pool.');

  cy.get('[data-cy="undelegate confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="undelegate confirm button"]').click();

  cy.contains('[data-status="error"]', 'Unlock collateral failed').should('exist');
  cy.contains('[data-status="error"]', 'MinDelegationTimeoutPending').should('exist');

  // TODO: update settings and allow to unlock without delay
  //
  //  cy.contains('[data-status="success"]', 'Your locked collateral amount has been updated.').should(
  //    'exist'
  //  );
});
