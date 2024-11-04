import { generatePath } from 'react-router-dom';

before(() => {
  cy.task('evmSnapshot').then((snapshot) => {
    cy.wrap(snapshot).as('snapshot');
  });
});
after(() => {
  cy.get('@snapshot').then(async (snapshot) => {
    cy.task('evmRevert', snapshot);
  });
});

it('should deposit additional USDC collateral', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('getUSDC', { address, amount: 500 });
    cy.task('createAccount', { address, accountId });
  });

  cy.viewport(1000, 1200);

  cy.get('@accountId').then(async (accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'USDC',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=deposit&accountId=${accountId}`);
  });

  cy.get('[data-cy="close position"]').should('exist');
  cy.get('[data-cy="close position"]').click();

  cy.get('[data-cy="close position multistep"]')
    .should('exist')
    .and('include.text', 'Approve USDC transfer')
    .and('include.text', 'Deposit & Lock USDC')
    .and('include.text', 'This will deposit & lock 101 USDC in Spartan Council Pool.');

  cy.get('[data-cy="close position confirm button"]')
    .should('include.text', 'Execute Transaction')
    .click();

  // cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '101 USDC');
});
