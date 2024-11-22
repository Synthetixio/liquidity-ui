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
      });
      return config;
    },

    viewportWidth: 1000,
    viewportHeight: 1200,

    video: true,

    retries: {
      runMode: 0,
      openMode: 0,
    },

    defaultCommandTimeout: 300_000,
    execTimeout: 60_000,
    taskTimeout: 60_000,
  },
});
