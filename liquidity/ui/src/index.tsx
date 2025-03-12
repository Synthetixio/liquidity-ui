import ReactDOM from 'react-dom/client';
import { devtoolsFormatters } from '@synthetixio/devtools-formatters';
import { magicWallet } from '@synthetixio/magic-wallet';
import { App } from './App';

const container = document.querySelector('#app');

declare global {
  var $magicWallet: `0x${string}`; // eslint-disable-line no-var
  var $chainId: number; // eslint-disable-line no-var
  var ethereum: any; // eslint-disable-line no-var
  var _paq: any; // eslint-disable-line no-var
}

export async function bootstrap() {
  if (!container) {
    throw new Error('Container #app does not exist');
  }
  if (window.localStorage.DEBUG === 'true') {
    await devtoolsFormatters();
  }
  if (window.localStorage.MAGIC_WALLET && `${window.localStorage.MAGIC_WALLET}`.length === 42) {
    await magicWallet(window.localStorage.MAGIC_WALLET);
  }
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
