import { ethers } from 'ethers';

export class MagicProvider extends ethers.providers.JsonRpcProvider {
  // @ts-ignore
  readonly magicWallet: string;
  // @ts-ignore
  readonly chainId: number;

  constructor() {
    if (!window.$chainId) {
      throw new Error('Empty window.$chainId');
    }
    if (!window.$magicWallet) {
      throw new Error('Empty window.$magicWallet');
    }
    super('http://127.0.0.1:8545', { chainId: window.$chainId, name: 'Anvil' });
    Object.defineProperty(this, 'magicWallet', {
      enumerable: true,
      value: window.$magicWallet,
      writable: false,
    });
    Object.defineProperty(this, 'chainId', {
      enumerable: true,
      value: window.$chainId,
      writable: false,
    });
  }

  async listAccounts(): Promise<Array<string>> {
    return [this.magicWallet];
  }

  async send(method: string, params: Array<any>): Promise<any> {
    if (method === 'eth_chainId') {
      return `0x${Number(this.chainId).toString(16)}`;
    }
    if (method === 'eth_accounts') {
      return [this.magicWallet];
    }
    return super.send(method, params);
  }
}
