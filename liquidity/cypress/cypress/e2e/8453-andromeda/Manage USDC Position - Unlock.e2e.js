import { generatePath } from 'react-router-dom';

it('should be able to unlock USDC collateral after depositing', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('getUSDC', { address: address, amount: 1000 });
    cy.task('approveCollateral', { address, symbol: 'USDC', target: 'spotMarket' });
    cy.task('wrapCollateral', { address, symbol: 'USDC', amount: 500 });
    cy.task('approveCollateral', { address, symbol: 'sUSDC' });
    cy.task('createAccount', { address, accountId });

    cy.task('depositCollateral', {
      address,
      symbol: 'sUSDC',
      accountId,
      amount: 150,
    });

    cy.task('delegateCollateral', {
      address,
      symbol: 'sUSDC',
      accountId,
      amount: 150,
      poolId: 1,
    });
  });

  cy.get('@accountId').then(async (accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'USDC',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=undelegate&accountId=${accountId}`);
  });

  cy.get('[data-cy="undelegate amount input"]').should('exist');
  cy.get('[data-cy="undelegate amount input"]').type('30');
  cy.get('[data-cy="undelegate submit"]').should('be.enabled');
  cy.get('[data-cy="undelegate submit"]').click();

  cy.get('[data-cy="undelegate multistep"]')
    .should('exist')
    .and('include.text', '30 USDC will be unlocked from the pool.');

  cy.get('[data-cy="undelegate confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="undelegate confirm button"]').click();

  cy.contains('[data-status="success"]', 'Your locked collateral amount has been updated.').should(
    'exist'
  );
});
