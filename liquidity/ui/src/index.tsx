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
  if (window.localStorage.DEBUG === 'true' || window.localStorage.DEBUG?.slice(0, 3) === 'snx') {
    const { Wei } = await import('@synthetixio/wei');
    const { ethers } = await import('ethers');

    function number(obj: any) {
      if (obj.eq(ethers.constants.MaxUint256)) {
        return 'MaxUint256';
      }
      if (obj.eq(ethers.constants.MaxInt256)) {
        return 'MaxInt256';
      }
      if (obj.abs().gt(1e10)) {
        // Assuming everything bigger than 1e10 is a wei
        return `wei ${parseFloat(ethers.utils.formatEther(`${obj}`))}`;
      }
      return parseFloat(obj.toString());
    }
    // @ts-ignore
    window.devtoolsFormatters = window.devtoolsFormatters ?? [];
    // @ts-ignore
    window.devtoolsFormatters.push({
      header: function (obj: any) {
        if (obj instanceof ethers.BigNumber) {
          return [
            'div',
            { style: 'color: #6ff' },
            ['span', {}, 'BigNumber('],
            ['span', { style: 'color: #ff3' }, number(obj)],
            ['span', {}, ' '],
            ['span', { style: 'color: #3f3' }, obj.toHexString()],
            ['span', {}, ')'],
          ];
        }
        if (obj instanceof Wei) {
          return [
            'div',
            { style: 'color: #6ff' },
            ['span', {}, 'Wei('],
            ['span', { style: 'color: #ff3' }, number(ethers.BigNumber.from(obj.toBN()))],
            ['span', {}, ' '],
            ['span', { style: 'color: #3f3' }, obj.toBN().toHexString()],
            ['span', {}, ')'],
          ];
        }
        return null;
      },
      hasBody: function () {
        return false;
      },
    });

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
