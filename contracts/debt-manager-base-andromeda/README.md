# Debt Manager for Base Andromeda

## Running tests

```sh
forge test -vvvvv --watch src test
```

Coverage report

```sh
forge coverage --report lcov
genhtml ./lcov.info --output-directory coverage
```

To install `genhtml`:

```sh
brew install lcov
```

## Deploy

Base Andromeda Sepolia

```sh
forge create \
  --rpc-url https://base-sepolia.infura.io/v3/$INFURA_API_KEY \
  --chain 84532 \
  --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  src/DebtRepayer.sol:DebtRepayer
```

Base Andromeda Mainnet

```sh
forge create \
  --rpc-url https://base-mainnet.infura.io/v3/$INFURA_API_KEY \
  --chain 8453 \
  --private-key $MAINNET_DEPLOYER_PRIVATE_KEY \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  src/DebtRepayer.sol:DebtRepayer
```
