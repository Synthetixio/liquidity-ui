import { generatePath } from 'react-router-dom';

it('Manage Static AaveUSDC Position - Deposit', () => {
  cy.connectWallet().then(({ address, accountId }) => {
    cy.wrap(address).as('wallet');
    cy.wrap(accountId).as('accountId');

    cy.task('setEthBalance', { address, balance: 100 });
    cy.task('getUSDC', { address: address, amount: 1000 });
    cy.task('createAccount', { address, accountId });
  });

  cy.viewport(1000, 1200);

  cy.get('@accountId').then((accountId) => {
    const path = generatePath('/positions/:collateralSymbol/:poolId', {
      collateralSymbol: 'stataUSDC',
      poolId: 1,
    });
    cy.visit(`/#${path}?manageAction=deposit&accountId=${accountId}`);
  });

  // Temporary fix for URL to fully resolve accountId, until refactored
  cy.wait(5000);

  cy.get('[data-cy="balance amount"]').should('exist').and('include.text', 'Max');
  cy.get('[data-cy="deposit amount input"]').should('exist');
  cy.get('[data-cy="deposit amount input"]').type('1');
  cy.get('[data-cy="deposit submit"]').should('be.enabled');
  cy.get('[data-cy="deposit submit"]').click();

  cy.get('[data-cy="deposit multistep"]')
    .should('exist')
    .and('include.text', 'Manage Collateral')
    .and('include.text', 'Approve USDC transfer')
    .and('include.text', 'Wrap USDC into Static aUSDC')
    .and('include.text', 'Approve Static aUSDC transfer')
    .and('include.text', 'Deposit and Lock Static aUSDC');

  cy.get('[data-cy="deposit confirm button"]').should('include.text', 'Execute Transaction');
  cy.get('[data-cy="deposit confirm button"]').click();

  cy.contains('[data-status="success"]', 'Your locked collateral amount has been updated.').should(
    'exist'
  );
});
