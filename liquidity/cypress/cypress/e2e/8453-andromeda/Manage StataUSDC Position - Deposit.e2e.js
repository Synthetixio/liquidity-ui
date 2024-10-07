import { generatePath } from 'react-router-dom';

it('should deposit additional USDC collateral', () => {
  cy.connectWallet().then(({ address, privateKey }) => {
    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('getUSDC', { address: address, amount: 1000 });
    cy.task('createAccount', { privateKey }).then((accountId) => {
      cy.wrap(accountId).as('accountId');
    });
  });

  cy.get('@accountId').then(async (accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'stataUSDC',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=deposit&accountId=${accountId}`);
  });

  cy.get('[data-cy="deposit amount input"]').should('exist').type('200');
  cy.get('[data-cy="deposit submit"]').should('be.enabled').click();

  cy.get('[data-cy="deposit multistep"]')
    .should('exist')
    .and('include.text', 'Open Liquidity Position')
    .and('include.text', 'Approve USDC transfer')
    .and('include.text', 'Wrap USDC into Static aUSDC')
    .and('include.text', 'Approve Static aUSDC transfer')
    .and('include.text', 'Deposit and Lock Static aUSDC')
    .and('include.text', 'This will deposit and lock 200 USDC to Spartan Council Pool.');

  cy.get('[data-cy="deposit confirm button"]')
    .should('include.text', 'Execute Transaction')
    .click();

  cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '200 USDC');

  cy.get('[data-cy="deposit amount input"]').should('exist').clear().type('69');
  cy.get('[data-cy="deposit submit"]').should('be.enabled').click();

  cy.get('[data-cy="deposit multistep"]')
    .should('exist')
    .and('include.text', 'Manage Collateral')
    .and('include.text', 'Approve USDC transfer')
    .and('include.text', 'Deposit & Lock USDC')
    .and('include.text', 'This will deposit and lock 69 USDC to Spartan Council Pool.');

  cy.get('[data-cy="deposit confirm button"]')
    .should('include.text', 'Execute Transaction')
    .click();

  cy.get('[data-cy="manage stats collateral"]').should('exist').and('include.text', '269 USDC');
});
