# Position Manager contract

## Running tests

```sh
forge test -vvvvv --watch src test
```

Coverage report

```sh
./cov.sh
```

or

```sh
forge coverage -vvvvv --report lcov --report-file /tmp/lcov.info
lcov --rc derive_function_end_line=0 --remove /tmp/lcov.info -o /tmp/clean.lcov.info '../../node_modules/' 'test/' 'src/lib'
genhtml --rc derive_function_end_line=0 /tmp/clean.lcov.info --output-directory coverage
```

To install `genhtml`:

```sh
brew install lcov
```

## Deploy

```sh
export ETHERSCAN_API_KEY=
export ETHERSCAN_API_URL=https://api.etherscan.io/api
export ETHERSCAN_SEPOLIA_API_URL=https://api-sepolia.etherscan.io/api

export ARBISCAN_API_KEY=
export ARBISCAN_API_URL=https://api.arbiscan.io/api
export ARBISCAN_SEPOLIA_API_URL=https://api-sepolia.arbiscan.io/api

export BASESCAN_API_KEY=
export BASESCAN_API_URL=https://api.basescan.org/api
export BASESCAN_SEPOLIA_API_URL=https://api-sepolia.basescan.org/api

export OPTIMISTIC_ETHERSCAN_API_KEY=
export OPTIMISTIC_ETHERSCAN_API_URL=https://api-optimistic.etherscan.io/api
```

Arbitrum Sepolia

```sh
forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://arbitrum-sepolia.infura.io/v3/$INFURA_API_KEY \
  --chain 421614 \
  --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $ARBISCAN_SEPOLIA_API_URL \
  --etherscan-api-key $ARBISCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManager
```

Arbitrum Mainnet

```sh
forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://arbitrum-mainnet.infura.io/v3/$INFURA_API_KEY \
  --chain 42161 \
  --private-key $MAINNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $ARBISCAN_API_URL \
  --etherscan-api-key $ARBISCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManager
```

Ethereum Sepolia

```sh
forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://sepolia.infura.io/v3/$INFURA_API_KEY \
  --chain 11155111 \
  --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $ETHERSCAN_SEPOLIA_API_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManager
```

Ethereum Mainnet

```sh
forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://mainnet.infura.io/v3/$INFURA_API_KEY \
  --chain 1 \
  --private-key $MAINNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $ETHERSCAN_API_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManager
```

Optimism Mainnet

```sh
forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://optimism-mainnet.infura.io/v3/$INFURA_API_KEY \
  --chain 10 \
  --private-key $MAINNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $OPTIMISTIC_ETHERSCAN_API_URL \
  --etherscan-api-key $OPTIMISTIC_ETHERSCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManager
```

## Verify contract

If something went wrong verifying first time

```sh
forge verify-contract \
  --chain 1 \
  --verifier-url $ETHERSCAN_API_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --watch \
  0xADD7E55 \
  src/PositionManager.sol:PositionManager

forge verify-contract \
  --chain 1 \
  --verifier-url $ETHERSCAN_API_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --watch \
  0xADD7E55 \
  src/PositionManager.sol:PositionManager

forge verify-contract \
  --chain 421614 \
  --verifier-url $ARBISCAN_SEPOLIA_API_URL \
  --etherscan-api-key $ARBISCAN_API_KEY \
  --watch \
  0xADD7E55 \
  src/PositionManager.sol:PositionManager

forge verify-contract \
  --chain 42161 \
  --verifier-url $ARBISCAN_API_URL \
  --etherscan-api-key $ARBISCAN_API_KEY \
  --watch \
  0xADD7E55 \
  src/PositionManager.sol:PositionManager

forge verify-contract \
  --chain 10 \
  --verifier-url $OPTIMISTIC_ETHERSCAN_API_URL \
  --etherscan-api-key $OPTIMISTIC_ETHERSCAN_API_KEY \
  --watch \
  0xADD7E55 \
  src/PositionManager.sol:PositionManager
```
