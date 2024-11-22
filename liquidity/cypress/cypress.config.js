const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'junit',
  reporterOptions: {
    mochaFile: './cypress/reports/junit-results.[hash].xml',
    toConsole: false,
  },

  component: {
    watchForFileChanges: false,
    specPattern: ['../**/*.cy.{js,jsx,ts,tsx}'],
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: require('@snx-v3/liquidity/webpack.config'),
    },
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
  },

  e2e: {
    watchForFileChanges: false,
    specPattern: ['../**/*.e2e.{js,jsx,ts,tsx}'],
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      require('cypress-terminal-report/src/installLogsPrinter')(on, {
        printLogsToConsole: 'always',
        includeSuccessfulHookLogs: true,
      });
      require('@cypress/code-coverage/task')(on, config);
      //      }
      on('task', {
        ...require('./cypress/tasks/anvil'),
        ...require('./cypress/tasks/automineBlocks'),
        ...require('./cypress/tasks/mineBlock'),
        ...require('./cypress/tasks/setEthBalance'),
        ...require('./cypress/tasks/wrapEth'),
        ...require('./cypress/tasks/getCollateralConfig'),
        ...require('./cypress/tasks/getSnx'),
        ...require('./cypress/tasks/createAccount'),
        ...require('./cypress/tasks/approveCollateral'),
        ...require('./cypress/tasks/depositCollateral'),
        ...require('./cypress/tasks/delegateCollateral'),
        ...require('./cypress/tasks/borrowUsd'),
        ...require('./cypress/tasks/setConfig'),
        ...require('./cypress/tasks/getSUSDC'),
        ...require('./cypress/tasks/getUSDC'),
        ...require('./cypress/tasks/doAllPriceUpdates'),
        ...require('./cypress/tasks/doPriceUpdateForPyth'),
        ...require('./cypress/tasks/snapshot'),
        ...require('./cypress/tasks/wrapCollateral'),
      });
      return config;
    },
    video: true,

    retries: {
      runMode: 0,
      openMode: 0,
    },

    defaultCommandTimeout: 60_000,
    execTimeout: 60_000,
    taskTimeout: 60_000,
  },
});
