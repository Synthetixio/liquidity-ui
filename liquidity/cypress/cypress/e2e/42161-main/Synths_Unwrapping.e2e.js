import { makeSearch } from '@snx-v3/useParams';

describe(__filename, () => {
  Cypress.env('chainId', '42161');
  Cypress.env('preset', 'main');
  Cypress.env('walletAddress', '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345');
  Cypress.env('accountId', '58655818123');

  beforeEach(() => {
    cy.task('startAnvil', {
      chainId: Cypress.env('chainId'),
      forkUrl: `https://arbitrum-mainnet.infura.io/v3/${Cypress.env('INFURA_KEY')}`,
      block: '284040698',
    }).then(() => cy.log('Anvil started'));

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

    cy.visit(`?${makeSearch({ page: 'dashboard', accountId: Cypress.env('accountId') })}`);

    cy.get('[data-cy="unwrap synths submit"]', { timeout: 180_000 }).should('be.enabled');
    cy.get('[data-cy="unwrap synths submit"]').click();

    cy.get('[data-cy="unwrap synths dialog"]').should('exist');

    cy.get('[data-cy="unwrap synths info"]')
      .should('exist')
      .and('include.text', 'Unwrapping 0.00000041 WETH');

    cy.get('[data-cy="unwrap synths info"]', { timeout: 180_000 }).should(
      'include.text',
      'Unwrapped 0.00000041 WETH'
    );
    cy.contains('[data-status="success"]', 'Your synths have been unwrapped').should('exist');
    cy.get('[data-cy="transaction hash"]').should('exist');

    cy.contains('[data-cy="unwrap synths dialog"] button', 'Done').click();
    cy.get('[data-cy="synths table"]').should('include.text', 'You do not have any synths');
    cy.get('[data-cy="unwrap synths submit"]').should('be.disabled');
  });
});
