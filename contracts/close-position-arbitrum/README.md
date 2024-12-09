# Debt Repayer for Arbitrum

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

Arbitrum Sepolia

```sh
forge create \
  --rpc-url https://arbitrum-sepolia.infura.io/v3/$INFURA_API_KEY \
  --chain 421614 \
  --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
  --etherscan-api-key $ARBISCAN_API_KEY \
  --verify \
  src/ClosePosition.sol:ClosePosition
```

Arbitrum Mainnet

```sh
forge create \
  --rpc-url https://arbitrum-mainnet.infura.io/v3/$INFURA_API_KEY \
  --chain 42161 \
  --private-key $MAINNET_DEPLOYER_PRIVATE_KEY \
  --etherscan-api-key $ARBISCAN_API_KEY \
  --verify \
  src/ClosePosition.sol:ClosePosition
```

Ethereum Sepolia

```sh
forge create \
  --rpc-url https://sepolia.infura.io/v3/$INFURA_API_KEY \
  --chain 11155111 \
  --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/ClosePosition.sol:ClosePosition
```

Ethereum Mainnet

```sh
forge create \
  --rpc-url https://mainnet.infura.io/v3/$INFURA_API_KEY \
  --chain 1 \
  --private-key $MAINNET_DEPLOYER_PRIVATE_KEY \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/ClosePosition.sol:ClosePosition
```

## Verify contract

If something went wrong verifying first time

```sh
forge verify-contract \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  0x800B12D24ebb639BCe7280861b05149F0D60F99e \
  src/ClosePosition.sol:ClosePosition

forge verify-contract \
  --verifier-url "https://api.arbiscan.io/api" \
  --etherscan-api-key $ARBISCAN_API_KEY \
  0x800B12D24ebb639BCe7280861b05149F0D60F99e \
  src/DebtRepayer.sol:DebtRepayer
```
