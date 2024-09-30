# Synthetix Liquidity UI

This repo uses Yarn workspaces to manage multiple packages in the same repo. To prepare the repository for use, run:

```sh
yarn install
```

This will install all dependencies, wire dependencies between packages in this repo, and allow for you to build projects.

Periodically we need to upgrade contacts:

```sh
yarn upgrade-contracts
yarn dedupe
```

and browserlists:

```sh
yarn upgrade-browsers
yarn dedupe
```

## Testing and local dev requirements

1. Install `foundry`

```sh
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Have `INFURA_KEY` env variable set

## Testing Base

1.  Run Foundry Anvil fork

    ```sh
    yarn anvil:base
    ```

2.  Update all prices

    ```sh
    yarn update-prices:base
    ```

3.  Run Liquidity app locally

    ```sh
    yarn start
    ```

4.  Open Cypress for Base
    ```sh
    yarn e2e:base
    ```

## Local development with fork and Magic Wallet

Example for Arbitrum Mainnet

All RPC calls in this mode will be made to `127.0.0.1:8585`
and all transactions will be automatically signed, without any popups

1.  Run Foundry Anvil fork

    ```sh
    yarn anvil:arbitrum
    ```

2.  Update all prices (optionally, to speed up UI as it will not need to attach price updates to each call)

    ```sh
    yarn update-prices:arbitrum
    ```

3.  Run Liquidity app locally

    ```sh
    yarn start
    ```

4.  Open app in browser

    ```sh
    open http://localhost:3000
    ```

5.  Open devtools and set `localStorage` values

    ```js
    localStorage.DEBUG = 'true';
    localStorage.MAGIC_WALLET = 'true';
    localStorage.WALLET = '0xWhateverWalletAddressYouWantToWorkWith';
    ```

6.  Reload page and proceed with connecting your wallet through UI choosing "Metamask" in popup
    (the only option)
