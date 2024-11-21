import '@cypress/code-coverage/support';
import { onLogAdded } from '@snx-cy/onLogAdded';
import { subgraph } from '../lib/subgraph';

afterEach(() => {
  cy.task('stopAnvil').then(() => {
    cy.log('Anvil stopped');
  });
  //  cy.get('@snapshot').then(async (snapshot) => {
  //    cy.task('evmRevert', snapshot);
  //  });
});

beforeEach(() => {
  const chainId = Cypress.env('CHAIN_ID');
  if (!chainId) {
    throw new Error('CYPRESS_CHAIN_ID is required');
  }
  const forkUrl = Cypress.env('PROVIDER_URL');
  if (!forkUrl) {
    throw new Error('CYPRESS_PROVIDER_URL is required');
  }
  const block = Cypress.env('FORK_BLOCK_NUMBER');
  if (!block) {
    throw new Error('CYPRESS_FORK_BLOCK_NUMBER is required');
  }
  cy.task('startAnvil', { chainId, forkUrl, block }).then(() => {
    cy.log('Anvil started');
  });

  //  cy.task('evmSnapshot').then((snapshot) => {
  //    cy.wrap(snapshot).as('snapshot');
  //  });

  // cy.on('log:added', onLogAdded);

  cy.intercept('https://analytics.synthetix.io/matomo.js', { statusCode: 204, log: false }).as(
    'matomo'
  );
  cy.intercept('https://cloudflare-eth.com/**', { statusCode: 400, log: false }).as(
    'cloudflare-eth'
  );
  //  cy.intercept('https://hermes-mainnet.rpc.extrnode.com/**', { statusCode: 400 }).as('pyth');
  cy.intercept('https://hermes-mainnet.rpc.extrnode.com/**', { log: false });
  //  cy.intercept('https://hermes-mainnet.rpc.extrnode.com/**', (req) => {
  //    return req.reply([]);
  //  }).as('pyth');
  // cy.intercept('https://synthetixio.github.io/**/*.svg', { statusCode: 404 }).as('assets');
  cy.intercept('synthetixio.github.io/**/*.svg', (req) => {
    return req.reply(`
      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" fill="none">
        <circle cx="21" cy="21" r="21" fill="url(#a)"/>
        <defs>
          <linearGradient id="a" x1="1.145" x2="50.119" y1="42" y2="27.586" gradientUnits="userSpaceOnUse">
            <stop stop-color="#34EDB3"/>
            <stop offset="1" stop-color="#00D1FF"/>
          </linearGradient>
        </defs>
      </svg>
    `);
  }).as('icon');
  cy.intercept('synthetixio.github.io/**/*.svg', { log: false });

  // Because we are working with local fork, subgraph becomes irrelevant
  cy.intercept('https://api.thegraph.com/**', (req) => {
    return subgraph(req);
  }).as('subgraph');
  cy.intercept('https://api.thegraph.com/**', { log: false });

  cy.intercept('https://subgraph.satsuma-prod.com/**', (req) => {
    return subgraph(req);
  }).as('subgraph');
  cy.intercept('https://subgraph.satsuma-prod.com/**', { log: false });

  [
    'mainnet',
    'optimism-mainnet',
    'base-mainnet',
    'sepolia',
    'base-sepolia',
    'arbitrum-mainnet',
    'arbitrum-sepolia',
  ].forEach((networkName) => {
    cy.intercept(`https://${networkName}.infura.io/v3/**`, (req) => {
      req.url = 'http://127.0.0.1:8545';
      req.continue();
    }).as(networkName);
    cy.intercept(`https://${networkName}.infura.io/v3/**`, { log: false });
  });

  cy.intercept(`http://127.0.0.1:8545`, { log: false });
  //  cy.intercept(`https://api.synthetix.io/**`, { statusCode: 400 }).as('api');
  cy.intercept(`https://api.synthetix.io/**`, { log: false });

  cy.on('window:before:load', (win) => {
    win.console.log = () => {};
    win.console.error = () => {};
    win.console.warn = () => {};

    win.sessionStorage.setItem('TERMS_CONDITIONS_ACCEPTED', 'true');
    win.localStorage.setItem(
      'DEFAULT_NETWORK',
      `${Cypress.env('CHAIN_ID')}-${Cypress.env('PRESET')}`
    );
    win.localStorage.setItem('UNSAFE_IMPORT', 'true');
    win.localStorage.setItem('connectedWallets', '"MetaMask"');
    win.localStorage.setItem('CONTRACT_ERROR_OPEN', 'true');
    // win.localStorage.setItem('DEBUG', 'true');
  });
});

Cypress.Commands.add('connectWallet', () => {
  const address = '0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345';

  let accountId;
  switch (`${Cypress.env('CHAIN_ID')}-${Cypress.env('PRESET')}`) {
    case '1-main':
      accountId = '651583203448';
      break;
    case '11155111-main':
      accountId = '777777';
      break;
    case '10-main':
      accountId = '58655818123';
      break;
    case '8453-andromeda':
      accountId = '522433293696';
      break;
    case '84532-andromeda':
      // does not exist but will create one
      accountId = '522433293696';
    case '42161-main':
      accountId = '58655818123';
      break;
    case '421614-main':
      accountId = '200489353353';
      break;

    default:
      accountId = '777777';
  }

  cy.on('window:before:load', (win) => {
    win.localStorage.setItem('MAGIC_WALLET', address);
  });
  return { address, accountId };
});
