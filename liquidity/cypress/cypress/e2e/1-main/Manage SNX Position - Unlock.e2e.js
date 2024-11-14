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

it('should be able to unlock SNX collateral after depositing', () => {
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

  cy.visit(`/`);
  cy.wait(2000);

  cy.get('@accountId').then(async (accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'SNX',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=undelegate&accountId=${accountId}`);
  });

  cy.get('[data-cy="undelegate amount input"]').should('exist');
  cy.get('[data-cy="undelegate amount input"]').type('30');
  cy.get('[data-cy="undelegate submit"]').should('be.enabled');
  cy.get('[data-cy="undelegate submit"]').click();

  cy.get('[data-cy="undelegate confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="undelegate confirm button"]').click();

  cy.wait(3000);
  cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '120 SNX');
});
