import { appMetadata, NETWORKS } from '@snx-v3/useBlockchain';
import coinbaseModule from '@web3-onboard/coinbase';
import type { ChainWithDecimalId } from '@web3-onboard/common';
import gnosisModule from '@web3-onboard/gnosis';
import injectedModule, { ProviderLabel } from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import { init } from '@web3-onboard/react';
import trezorModule from '@web3-onboard/trezor';
import walletConnectModule from '@web3-onboard/walletconnect';

// Filter networks to only supported ones
export const chains: ChainWithDecimalId[] = Object.values(
  NETWORKS.reduce((result, network) => {
    if (!network.isSupported) {
      return result;
    }
    if (network.id in result) {
      // We cannot have duplicate chains, but we can have multiple deployments per chain
      return result;
    }
    return Object.assign(result, {
      [network.id]: {
        id: network.id,
        token: network.token,
        label: network.label,
        rpcUrl: network.rpcUrl,
        publicRpcUrl: network.publicRpcUrl,
      },
    });
  }, {})
);

export const onboard = init({
  theme: 'dark',
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
          appUrl: 'https://liquidity.synthetix.io',
          email: 'info@synthetix.io',
        }),
        ledgerModule({
          projectId: 'd6eac005846a1c3be1f8eea3a294eed9',
          walletConnectVersion: 2,
        }),
        walletConnectModule({
          version: 2,
          projectId: 'd6eac005846a1c3be1f8eea3a294eed9',
          dappUrl: 'liquidity.synthetix.io',
        }),
        gnosisModule(),
      ],
  chains,
  appMetadata: {
    ...appMetadata,
    name: 'Synthetix Liquidity',
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
