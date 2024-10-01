import { generatePath } from 'react-router-dom';

it('should deposit additional WETH collateral', () => {
  cy.connectWallet().then(({ address, privateKey }) => {
    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('wrapEth', { privateKey: privateKey, amount: 50 });
    cy.task('approveCollateral', { privateKey: privateKey, symbol: 'WETH' });
    cy.task('createAccount', { privateKey }).then((accountId) => {
      cy.wrap(accountId).as('accountId');
    });
  });

  cy.get('@accountId').then(async (accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'WETH',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=deposit&accountId=${accountId}`);
    cy.wait(1000);
  });

  cy.get('[data-cy="deposit amount input"]').should('exist').type('1');
  cy.get('[data-cy="deposit submit"]').should('be.enabled').click();

  cy.get('[data-cy="deposit multistep"]')
    .should('exist')
    .and('include.text', 'Open Liquidity Position')
    .and('include.text', 'Approve WETH transfer')
    .and('include.text', 'Deposit & Lock WETH')
    .and('include.text', 'This will deposit and lock 1 WETH to Spartan Council Pool.');

  cy.get('[data-cy="deposit confirm button"]')
    .should('include.text', 'Execute Transaction')
    .click();

  cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '1 WETH');

  cy.get('[data-cy="deposit amount input"]').should('exist').clear().type('0.69');
  cy.get('[data-cy="deposit submit"]').should('be.enabled').click();

  cy.get('[data-cy="deposit multistep"]')
    .should('exist')
    .and('include.text', 'Manage Collateral')
    .and('include.text', 'Approve WETH transfer')
    .and('include.text', 'Deposit & Lock WETH')
    .and('include.text', 'This will deposit and lock 0.69 WETH to Spartan Council Pool.');

  cy.get('[data-cy="deposit confirm button"]')
    .should('include.text', 'Execute Transaction')
    .click();

  cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '1.69 WETH');
});
