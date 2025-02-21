/* global window */

async function magicWallet(magicWallet) {
  const { ethers } = await import('ethers');
  window.$magicWallet = magicWallet;
  if (ethers.utils.isAddress(window.$magicWallet)) {
    const rpcProvider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    const network = await rpcProvider.getNetwork();
    window.$chainId = network.chainId;

    const { getMagicProvider } = await import('@snx-v3/useBlockchain');
    const magicProvider = getMagicProvider();
    window.ethereum = magicProvider
      ? new Proxy(magicProvider, {
          get(target, prop) {
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
                return async ({ method, params }) => {
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

module.exports = {
  magicWallet,
};
