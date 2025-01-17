import '@cypress/code-coverage/support';
import { default as installLogsCollector } from 'cypress-terminal-report/src/installLogsCollector';

import { approveCollateral } from './commands/approveCollateral';
import { borrowUsd } from './commands/borrowUsd';
import { clearDebt } from './commands/clearDebt';
import { delegateCollateral } from './commands/delegateCollateral';
import { delegateCollateralAndromeda } from './commands/delegateCollateralAndromeda';
import { depositCollateral } from './commands/depositCollateral';
import { getSNX } from './commands/getSNX';
import { getUSDC } from './commands/getUSDC';
import { setEthBalance } from './commands/setEthBalance';
import { wrapCollateral } from './commands/wrapCollateral';
import { wrapEth } from './commands/wrapEth';
import { setWithdrawTimeout } from './commands/setWithdrawTimeout';
import { getSUSD } from './commands/getSUSD';
import { getSystemToken } from './commands/getSystemToken';
import { pythBypass } from './commands/pythBypass';

installLogsCollector({
  enableExtendedCollector: true,
  enableContinuousLogging: true,
});

function addTxnCommand(name, command, options) {
  Cypress.Commands.add(name, (...args) => {
    cy.wrap(
      command(...args).then(
        () => `${name} ok`,
        (e) => `${name} error ${e.message}`
      ),
      options
    ).should('be.eq', `${name} ok`);
  });
}
addTxnCommand('approveCollateral', approveCollateral, { timeout: 30_000 });
addTxnCommand('borrowUsd', borrowUsd, { timeout: 180_000 });
addTxnCommand('clearDebt', clearDebt, { timeout: 180_000 });
addTxnCommand('delegateCollateral', delegateCollateral, { timeout: 180_000 });
addTxnCommand('delegateCollateralAndromeda', delegateCollateralAndromeda, { timeout: 180_000 });
addTxnCommand('depositCollateral', depositCollateral, { timeout: 60_000 });
addTxnCommand('getSNX', getSNX, { timeout: 60_000 });
addTxnCommand('getSUSD', getSUSD, { timeout: 60_000 });
addTxnCommand('getSystemToken', getSystemToken, { timeout: 60_000 });
addTxnCommand('getUSDC', getUSDC, { timeout: 60_000 });
addTxnCommand('setEthBalance', setEthBalance, { timeout: 30_000 });
addTxnCommand('setWithdrawTimeout', setWithdrawTimeout, { timeout: 60_000 });
addTxnCommand('wrapCollateral', wrapCollateral, { timeout: 120_000 });
addTxnCommand('wrapEth', wrapEth, { timeout: 60_000 });
addTxnCommand('pythBypass', pythBypass);

function subgraph(req) {
  const body = JSON.parse(req.body);
  if (body.query.trim().startsWith('query pool($id: String)')) {
    return req.reply({
      data: {
        pool: {
          id: body.variables.id,
          name: 'TEST_POOL',
          total_weight: (1e18).toString(),
          configurations: [],
        },
      },
    });
  }

  return req.reply({ data: null });
}

beforeEach(() => {
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
  cy.intercept(
    'https://gateway.thegraph.com/api/f55095f3203bcba72cbee045322be46c/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF',
    (req) => {
      return req.reply({
        data: {
          reserves: [
            {
              liquidityRate: '64596984541073909523456726',
              underlyingAsset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            },
          ],
        },
      });
    }
  ).as('stata-apy');
  cy.intercept(
    'https://gateway.thegraph.com/api/f55095f3203bcba72cbee045322be46c/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF',
    { log: false }
  );
  cy.on('window:before:load', (win) => {
    //    win.console.log = () => {};
    //    win.console.error = () => {};
    //    win.console.warn = () => {};
    win.sessionStorage.setItem('TERMS_CONDITIONS_ACCEPTED', 'true');
    win.localStorage.setItem('UNSAFE_IMPORT', 'true');
    win.localStorage.setItem('CONTRACT_ERROR_OPEN', 'true');
    win.localStorage.setItem('DEBUG', 'true');
    win.localStorage.setItem('debug', 'snx:*');
  });
});
