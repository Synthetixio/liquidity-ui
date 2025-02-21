import ReactDOM from 'react-dom/client';
import { devtoolsFormatters } from '@synthetixio/devtools-formatters';
import { magicWallet } from '@synthetixio/magic-wallet';
import { App } from './App';

const container = document.querySelector('#app');

export async function bootstrap() {
  if (!container) {
    throw new Error('Container #app does not exist');
  }
  if (window.localStorage.DEBUG === 'true') {
    devtoolsFormatters();
  }
  if (window.localStorage.MAGIC_WALLET && `${window.localStorage.MAGIC_WALLET}`.length === 42) {
    magicWallet(window.localStorage.MAGIC_WALLET);
  }
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
