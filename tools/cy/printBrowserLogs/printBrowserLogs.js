const CDP = require('chrome-remote-interface');
const util = require('util');
util.inspect.defaultOptions.breakLength = Infinity;
util.inspect.defaultOptions.depth = Infinity;
util.inspect.defaultOptions.maxArrayLength = Infinity;
util.inspect.defaultOptions.maxStringLength = Infinity;
util.inspect.defaultOptions.numericSeparator = true;
util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.compact = true;

function log(params) {
  if (params.type === 'debug') {
    return;
  }
  console.log('\n');

  if (params.entry) {
    delete params.entry.stackTrace;
    console.log(params.entry);
    return;
  }
  const props = params?.args?.[0]?.preview?.properties;
  if (props) {
    console.log(Object.fromEntries(props.map(({ name, value }) => [name, value])));
    return;
  }
  delete params.stackTrace;
  console.log(params);
}

function isChrome(browser) {
  return (
    browser.family === 'chrome' ||
    ['chrome', 'chromium', 'canary'].includes(browser.name) ||
    (browser.family === 'chromium' && browser.name !== 'electron')
  );
}

function ensureRdpPort(args) {
  const existing = args.find((arg) => arg.slice(0, 23) === '--remote-debugging-port');
  if (existing) {
    return Number(existing.split('=')[1]);
  }
  const port = 40000 + Math.round(Math.random() * 25000);
  args.push(`--remote-debugging-port=${port}`);
  return port;
}

export function printBrowserLogs(browser = {}, launchOptions) {
  console.log(launchOptions.args);

  const args = launchOptions.args || launchOptions;

  if (!isChrome(browser)) {
    return console.log(
      `Warning: An unsupported browser family was used, output will not be logged to console: ${browser.family}`
    );
  }

  const rdp = ensureRdpPort(args);

  console.log('Attempting to connect to Chrome Debugging Protocol');

  const tryConnect = () => {
    new CDP({ port: rdp })
      .then((cdp) => {
        console.log('Connected to Chrome Debugging Protocol');

        /** captures logs from the browser */
        cdp.Log.enable();
        cdp.Log.entryAdded(log);

        /** captures logs from console.X calls */
        cdp.Runtime.enable();
        cdp.Runtime.consoleAPICalled(log);

        cdp.on('disconnect', () => {
          console.log('Chrome Debugging Protocol disconnected');
          console.log('Reconnecting...');
          setTimeout(tryConnect, 100);
        });
      })
      .catch(() => {
        setTimeout(tryConnect, 100);
      });
  };

  tryConnect();

  return launchOptions;
}
