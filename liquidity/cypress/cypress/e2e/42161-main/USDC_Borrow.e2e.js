import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '58655818123');

  beforeEach(() => {
    cy.log(Cypress.env('provider'));

    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl:
        Cypress.env('RPC_ARBITRUM_MAINNET') ??
        `https://arbitrum-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '271813668',
    }).then(() => cy.log('Anvil started'));
    cy.pythBypass();

    cy.on('window:before:load', (win) => {
      win.localStorage.setItem('MAGIC_WALLET', Cypress.env('walletAddress'));
      win.localStorage.setItem(
        'DEFAULT_NETWORK',
        `${Cypress.env('chainId')}-${Cypress.env('preset')}`
      );
    });
  });
  afterEach(() => cy.task('stopAnvil').then(() => cy.log('Anvil stopped')));

  it(__filename, () => {
    cy.setEthBalance({ balance: 100 });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'USDC',
        manageAction: 'claim',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="borrow form"]').should('exist');
    cy.get('[data-cy="max borrow amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="stats collateral"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '249 USDC');
    cy.get('[data-cy="stats debt"] [data-cy="change stats new"]').should('not.exist');
    cy.get('[data-cy="stats debt"] [data-cy="change stats current"]')
      .should('exist')
      .and('include.text', '$1.28');

    cy.get('[data-cy="borrow amount input"]').type('10');

    cy.get('[data-cy="stats debt"] [data-cy="change stats new"]')
      .should('exist')
      .and('include.text', '$11.28');

    cy.get('[data-cy="borrow submit"]').should('be.enabled').and('include.text', 'Borrow');
    cy.get('[data-cy="borrow submit"]').click();

    cy.get('[data-cy="borrow dialog"]')
      .should('exist')
      .and('include.text', 'Borrowing Debt')
      .and('include.text', 'Borrowing 10 USDx');

    cy.contains('[data-status="success"]', 'Your debt has been increased', {
      timeout: 180_000,
    }).should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.get('[data-cy="borrow dialog"]').should('exist').and('include.text', 'Borrowed 10 USDx');

    cy.contains('[data-cy="borrow dialog"] button', 'Done').click();

    cy.get('[data-cy="stats debt"] [data-cy="change stats current"]', { timeout: 180_000 }).and(
      'include.text',
      '$11.28'
    );

    cy.get('[data-cy="borrow submit"]').should('be.disabled');
  });
});
