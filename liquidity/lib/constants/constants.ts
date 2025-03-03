import Wei from '@synthetixio/wei';
import { ethers } from 'ethers';

export const LOCAL_STORAGE_KEYS = {
  SHOW_TESTNETS: 'SHOW_TESTNETS',
};
export const ZEROWEI = new Wei(0);

export const D6 = ethers.utils.parseUnits('1', 6);
export const D18 = ethers.utils.parseUnits('1', 18);
export const D27 = ethers.utils.parseUnits('1', 27);

export const DEFAULT_QUERY_STALE_TIME = 300_000; // 5min

export const INFURA_KEY = process.env.INFURA_KEY || '8678fe160b1f4d45ad3f3f71502fc57b';

export const getSubgraphUrl = (networkName = 'optimism-mainnet') => {
  switch (networkName) {
    case 'mainnet':
      return 'https://subgraph.satsuma-prod.com/ce5e03f52f3b/synthetix/synthetix-mainnet/api';
    case 'sepolia':
      return 'https://subgraph.satsuma-prod.com/ce5e03f52f3b/synthetix/synthetix-sepolia/api';
    case 'optimism-mainnet':
      return 'https://subgraph.satsuma-prod.com/ce5e03f52f3b/synthetix/synthetix-optimism-mainnet/api';
    case 'arbitrum':
      return `https://subgraph.satsuma-prod.com/ce5e03f52f3b/synthetix/synthetix-arbitrum-mainnet/api`;
    case 'base-sepolia':
      return 'https://subgraph.satsuma-prod.com/ce5e03f52f3b/synthetix/synthetix-base-sepolia-andromeda/api';
    case 'base':
      return 'https://subgraph.satsuma-prod.com/ce5e03f52f3b/synthetix/synthetix-base-mainnet-andromeda/api';
    default:
      return `https://subgraph.satsuma-prod.com/ce5e03f52f3b/synthetix/synthetix-${networkName}/api`;
  }
};

export const getAprUrl = (networkId = 8453) => {
  switch (networkId) {
    case 1:
      return 'https://api.synthetix.io/v3/mainnet/sc-pool-apy-all';
    case 8453:
      return 'https://api.synthetix.io/v3/base/sc-pool-apy-all';
    case 42161:
      return 'https://api.synthetix.io/v3/arbitrum/sc-pool-apy-all';
    default:
      return `https://api.synthetix.io/v3/base/sc-pool-apy-all`;
  }
};

export const getClaimedRewardsURL = (networkId = 8453) => {
  switch (networkId) {
    case 1:
      return 'https://api.synthetix.io/v3/mainnet/rewards-claimed';
    case 8453:
      return 'https://api.synthetix.io/v3/base/rewards-claimed';
    default:
      return '';
  }
};

export const SESSION_STORAGE_KEYS = {
  TERMS_CONDITIONS_ACCEPTED: 'TERMS_CONDITIONS_ACCEPTED',
};

export const offchainMainnetEndpoint =
  process.env.PYTH_MAINNET_ENDPOINT ||
  'https://hermes-mainnet.rpc.extrnode.com/9b85d7db-f562-48e2-ab56-79c01f212582';

export const offchainTestnetEndpoint =
  process.env.PYTH_TESTNET_ENDPOINT ||
  'https://hermes-mainnet.rpc.extrnode.com/9b85d7db-f562-48e2-ab56-79c01f212582';

export const tokenOverrides: {
  [key: `${number}-${string}`]: {
    [key: string]:
      | {
          symbol: string;
          displaySymbol: string;
          name: string;
        }
      | undefined;
  };
} = {
  '8453-andromeda': {
    '0x4EA71A20e655794051D1eE8b6e4A3269B13ccaCc': {
      symbol: 'stataUSDC',
      displaySymbol: 'Static aUSDC',
      name: 'Static aUSDC',
    },
  },
  '1-main': {
    '0x10A5F7D9D65bCc2734763444D4940a31b109275f': {
      symbol: 'sUSD',
      displaySymbol: 'V2 sUSD',
      name: 'V2 sUSD',
    },
    '0xb2F30A7C980f052f02563fb518dcc39e6bf38175': {
      symbol: 'sUSD',
      displaySymbol: 'V3 sUSD',
      name: 'V3 sUSD',
    },
  },
};

// We only have 1 pool and UI does not support more than one pool
// Will need to refactor when we add new pools
export const POOL_ID = '1';
