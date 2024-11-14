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

it('should be able to borrow sUSD after depositing SNX', () => {
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
    console.log({
      accountId,
    });
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'SNX',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=borrow&accountId=${accountId}`);
  });

  cy.get('[data-cy="borrow amount input"]').should('exist');
  cy.get('[data-cy="borrow amount input"]').type('10');
  cy.get('[data-cy="borrow submit"]').should('be.enabled');
  cy.get('[data-cy="borrow submit"]').click();

  cy.get('[data-cy="borrow multistep"]')
    .should('exist')
    .and('include.text', 'Borrow')
    .and('include.text', 'Borrow 10 sUSD');

  cy.get('[data-cy="borrow confirm button"]').should('include.text', 'Execute Transaction').click();

  cy.get('[data-cy="debt stats collateral"]').should('exist').and('include.text', '$10');
});
