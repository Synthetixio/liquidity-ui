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
    localStorage.DEBUG = 'true';
    localStorage.debug = 'snx:*';
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

## Testing with an empty test wallet (Base Mainnet)

Run Anvil at the block when the latest PM was deployed

```sh
anvil --auto-impersonate --chain-id 8453 --fork-url $RPC_BASE_MAINNET --no-rate-limit --accounts 0 --fork-block-number 25229684 --memory-limit 6442450944
```

Enable debugging and set magic wallet to `0xaaaa6c341C4Df916d9f0583Ba9Ea953618e5f008`

```js
localStorage.DEBUG = 'true';
localStorage.debug = 'snx:*';
localStorage.MAGIC_WALLET = '0xaaaa6c341C4Df916d9f0583Ba9Ea953618e5f008';
```

Fund the account with `ETH`, `USDC` and `snxUSD`

```sh
export USDC=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
export AaveUSDCPool=0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB
export walletAddress=0xaaaa6c341C4Df916d9f0583Ba9Ea953618e5f008
cast rpc anvil_setCode 0x1234123412341234123412341234123412341234 $(cast from-utf8 FORK)
cast rpc anvil_setBalance $AaveUSDCPool $(cast to-unit 1ether)
cast rpc anvil_setBalance $walletAddress $(cast to-unit 1ether)
export transfer='function transfer(address to, uint256 value) returns (bool)'
export balanceOf='function balanceOf(address account) view returns (uint256)'
cast send --unlocked --from $AaveUSDCPool $USDC $transfer $walletAddress 1000000000
cast call $USDC $balanceOf $walletAddress

export snxUSD="0x09d51516F38980035153a554c26Df3C6f51a23C3"
export CoreProxy="0x32C222A9A159782aFD7529c87FA34b96CA72C696"
cast rpc anvil_setBalance $CoreProxy $(cast to-unit 1ether)
cast send --unlocked --from $CoreProxy $snxUSD $transfer $walletAddress 1000ether
```
