# Synthetix Liquidity UI

[![main](https://github.com/synthetixio/v3ui/actions/workflows/main.yml/badge.svg)](https://github.com/synthetixio/v3ui/actions/workflows/main.yml)

## Install

This repo uses Yarn workspaces to manage multiple packages in the same repo. To prepare the repository for use, run:

```sh
yarn install
```

This will install all dependencies, wire dependencies between packages in this repo, and allow for you to build projects.

## Testing Requirements

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

## Upgrade contacts

```sh
yarn upgrade-contracts
yarn dedupe
```

## Upgrade browserlist

```sh
yarn upgrade-browsers
yarn dedupe
```
