import { generatePath } from 'react-router-dom';

before(() => {
  cy.task('evmSnapshot').then((snapshot) => {
    cy.wrap(snapshot).as('snapshot');
  });
});
after(() => {
  cy.get('@snapshot').then(async (snapshot) => {
    cy.task('evmRestore', snapshot);
  });
});

it('should borrow against WETH position', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 105 });
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

  cy.get('[data-cy="claim amount input"]').type('10');

  cy.contains(
    '[data-status="warning"]',
    'Assets will be available to withdraw 24 hours after your last interaction with this position.'
  ).should('exist');

  cy.contains('[data-status="info"]', 'You are about to take a $10 interest-free loan').should(
    'exist'
  );

  cy.get('[data-cy="claim submit"]').should('be.enabled');
  cy.get('[data-cy="claim submit"]').click();

  cy.get('[data-cy="claim multistep"]')
    .should('exist')
    .and('include.text', 'Manage Debt')
    .and('include.text', 'Borrow')
    .and('include.text', 'Borrow 10 USDx');

  cy.get('[data-cy="claim confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="claim confirm button"]').click();

  cy.contains('[data-status="info"]', 'Debt successfully Updated').should('exist');
});
