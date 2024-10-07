import ReactDOM from 'react-dom/client';
import { App } from './App';

const container = document.querySelector('#app');

declare global {
  var $ethers: any; // eslint-disable-line no-var
  var $magicWallet: `0x${string}`; // eslint-disable-line no-var
  var $chainId: number; // eslint-disable-line no-var
  var ethereum: any; // eslint-disable-line no-var
}

export async function bootstrap() {
  if (!container) {
    throw new Error('Container #app does not exist');
  }

  if (process.env.NODE_ENV === 'development') {
    const { Wei, wei } = await import('@synthetixio/wei');
    const { ethers } = await import('ethers');
    // @ts-ignore
    window.devtoolsFormatters = window.devtoolsFormatters ?? [];
    // @ts-ignore
    window.devtoolsFormatters.push({
      header: function (obj: any) {
        if (obj instanceof ethers.BigNumber) {
          return [
            'div',
            { style: 'color: #f33' },
            ['span', {}, 'ethers.BigNumber('],
            ['span', { style: 'color: #3f3' }, wei(obj).toString()],
            ['span', {}, ')'],
          ];
        }
        if (obj instanceof Wei) {
          return [
            'div',
            { style: 'color: #f33' },
            ['span', {}, 'Wei('],
            ['span', { style: 'color: #3f3' }, obj.toString()],
            ['span', {}, ')'],
          ];
        }
        return null;
      },
      hasBody: function () {
        return false;
      },
    });
  }

  if (window.localStorage.DEBUG === 'true') {
    const { ethers } = await import('ethers');
    window.$magicWallet = window.localStorage.MAGIC_WALLET;
    if (ethers.utils.isAddress(window.$magicWallet)) {
      const rpcProvider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      const network = await rpcProvider.getNetwork();
      window.$chainId = network.chainId;

      const { getMagicProvider } = await import('@snx-v3/useBlockchain');
      const magicProvider = getMagicProvider();
      window.ethereum = magicProvider
        ? new Proxy(magicProvider, {
            get(target: any, prop: any) {
              // console.log('MAGIC_WALLET', prop, { target: target[prop] });
              switch (prop) {
                case 'chainId':
                  return `0x${Number(window.$chainId).toString(16)}`;
                case 'isMetaMask':
                  return true;
                case 'getSigner':
                  return () => {
                    return magicProvider.getSigner(window.$magicWallet);
                  };
                case 'request':
                  return async ({ method, params }: { method: string; params: any }) => {
                    switch (method) {
                      case 'eth_accounts':
                      case 'eth_requestAccounts':
                        return [window.$magicWallet];
                      case 'eth_chainId':
                        return `0x${Number(window.$chainId).toString(16)}`;
                      case 'eth_sendTransaction':
                      default: {
                        try {
                          const result = await magicProvider.send(method, params);
                          console.log('MAGIC_WALLET', { method, params, result }); // eslint-disable-line no-console
                          return result;
                        } catch (error) {
                          console.log('MAGIC_WALLET', { method, params, error }); // eslint-disable-line no-console
                          throw error;
                        }
                      }
                    }
                  };
                default:
                  return target[prop];
              }
            },
          })
        : undefined;
    }
  }

  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
