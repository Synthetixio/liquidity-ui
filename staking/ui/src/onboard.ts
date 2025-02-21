import { appMetadata, MAINNET, OPTIMISM } from '@snx-v3/useBlockchain';
import coinbaseModule from '@web3-onboard/coinbase';
import type { ChainWithDecimalId } from '@web3-onboard/common';
import gnosisModule from '@web3-onboard/gnosis';
import injectedModule, { ProviderLabel } from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import { init } from '@web3-onboard/react';
import trezorModule from '@web3-onboard/trezor';
import walletConnectModule from '@web3-onboard/walletconnect';

export const chains: ChainWithDecimalId[] = [MAINNET, OPTIMISM].map((network) => ({
  id: network.id,
  token: network.token,
  label: network.label,
  rpcUrl: network.rpcUrl,
  publicRpcUrl: network.publicRpcUrl,
}));

export const onboard = init({
  connect: {
    autoConnectLastWallet: true,
    autoConnectAllPreviousWallet: true,
  },
  wallets: window.$magicWallet
    ? [injectedModule()]
    : [
        coinbaseModule(),
        injectedModule({ displayUnavailable: [ProviderLabel.MetaMask, ProviderLabel.Trust] }),
        trezorModule({
          appUrl: 'https://staking.synthetix.io',
          email: 'info@synthetix.io',
        }),
        ledgerModule({
          projectId: 'd6eac005846a1c3be1f8eea3a294eed9',
          walletConnectVersion: 2,
        }),
        walletConnectModule({
          version: 2,
          projectId: 'd6eac005846a1c3be1f8eea3a294eed9',
          dappUrl: 'staking.synthetix.io',
        }),
        gnosisModule(),
      ],
  chains,
  appMetadata: {
    ...appMetadata,
    name: 'Synthetix Staking',
  },
  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
  notify: {
    enabled: false,
  },
});
