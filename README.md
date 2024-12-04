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

## Testing with Cypress

1.  Run Liquidity app locally

    ```sh
    yarn start
    ```

2.  Open Cypress to debug

    ```sh
    yarn e2e
    ```

3.  To run all the tests for all chains
    ```sh
    yarn e2e:run
    ```

## Local development with fork and Magic Wallet

All RPC calls in this mode will be made to `127.0.0.1:8585`
and all transactions will be automatically signed, without any popups

1.  Run Foundry Anvil fork

    ```sh
    # Mainnets
    anvil --auto-impersonate --chain-id 1 --fork-url https://mainnet.infura.io/v3/$INFURA_KEY --fork-block-number 21233424
    anvil --auto-impersonate --chain-id 8453 --fork-url https://base-mainnet.infura.io/v3/$INFURA_KEY --fork-block-number 22991081
    anvil --auto-impersonate --chain-id 42161 --fork-url https://arbitrum-mainnet.infura.io/v3/$INFURA_KEY --fork-block-number 271813668

    # Testnets
    anvil --auto-impersonate --chain-id 11155111 --fork-url https://sepolia.infura.io/v3/$INFURA_KEY
    anvil --auto-impersonate --chain-id 84532 --fork-url https://base-sepolia.infura.io/v3/$INFURA_KEY
    anvil --auto-impersonate --chain-id 421614 --fork-url https://arbitrum-sepolia.infura.io/v3/$INFURA_KEY
    ```

2.  Run Liquidity app locally

    ```sh
    yarn start
    ```

3.  Open app in browser

    ```sh
    open http://localhost:3000
    ```

4.  Open devtools and set `localStorage` values

    ```js
    localStorage.DEBUG = 'snx:*';
    localStorage.MAGIC_WALLET = '0xWalletAddress';
    ```

5.  Reload page and proceed with connecting your wallet through UI choosing "Metamask" in popup
    (the only option)

6.  If wallet needs some ETH balance you can use foundry's `cast` to set balance

    ```sh
    cast rpc anvil_setBalance 0xWalletAddress 10000000000000000000

    # check your balance
    cast balance 0xWalletAddress -e
    ```
