import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '8453');
  Cypress.env('preset', 'andromeda');
  //  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  //  Cypress.env('accountId', '522433293696');

  Cypress.env('walletAddress', '0xc77b0cd1B1E73F6De8f606685Fb09Ace95f614c3');
  Cypress.env('accountId', '170141183460469231731687303715884105949');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl:
        Cypress.env('RPC_BASE_MAINNET') ??
        `https://base-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '22991081',
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
    cy.getUSDC({ amount: 1000 });

    cy.visit(
      `?${makeSearch({
        page: 'position',
        collateralSymbol: 'stataUSDC',
        manageAction: 'withdraw',
        accountId: Cypress.env('accountId'),
      })}`
    );

    cy.get('[data-cy="withdraw form"]').should('exist');
    cy.get('[data-cy="withdraw amount"]', { timeout: 180_000 })
      .should('exist')
      .and('include.text', 'Max');

    cy.get('[data-cy="withdraw amount input"]').should('exist');
    cy.get('[data-cy="withdraw amount input"]').type('1');
    cy.get('[data-cy="withdraw submit"]').should('be.enabled');
    cy.get('[data-cy="withdraw submit"]').click();

    cy.get('[data-cy="withdraw multistep"]')
      .should('exist')
      .and('include.text', '1 Static aUSDC will be withdrawn')
      .and('include.text', 'unwrap Static aUSDC into USDC');

    cy.get('[data-cy="withdraw confirm button"]').should('include.text', 'Execute Transaction');
    cy.get('[data-cy="withdraw confirm button"]').click();

    cy.contains('[data-status="success"]', 'Collateral successfully Withdrawn', {
      timeout: 60_000,
    }).should('exist');
  });
});
