import ReactDOM from 'react-dom/client';
import { App } from './App';

const container = document.querySelector('#app');

declare global {
  var $ethers: any; // eslint-disable-line no-var
  var $enable: () => Promise<void>; // eslint-disable-line no-var
  var $disable: () => void; // eslint-disable-line no-var
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
    window.$ethers = ethers;
    let address = window.localStorage.WALLET || '';
    if (!ethers.utils.isAddress(address)) {
      // First Address from Anvil
      address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    }

    window.$enable = async function () {
      window.localStorage.MAGIC_WALLET = 'true';
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      const network = await provider.getNetwork();
      await provider.send('anvil_setBalance', [
        address,
        ethers.utils.parseEther('10000').toHexString(),
      ]);
      window.ethereum = new Proxy(provider, {
        get(target: any, prop: any) {
          // console.log('MAGIC_WALLET', prop, { target: target[prop] });
          switch (prop) {
            case 'chainId':
              return `0x${Number(network.chainId).toString(16)}`;
            case 'isMetaMask':
              return true;
            case 'getSigner':
              return () => {
                return provider.getSigner(address);
              };
            case 'request':
              return async ({ method, params }: { method: string; params: any }) => {
                switch (method) {
                  case 'eth_accounts':
                  case 'eth_requestAccounts':
                    return [address];
                  case 'eth_chainId':
                    return `0x${Number(network.chainId).toString(16)}`;
                  case 'eth_sendTransaction':
                  default: {
                    try {
                      const result = await provider.send(method, params);
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
      });
    };
    if (window.localStorage.MAGIC_WALLET === 'true') {
      await window.$enable();
    }
  }

  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
