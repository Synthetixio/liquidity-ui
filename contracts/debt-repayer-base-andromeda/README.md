# Debt Repayer for Base Andromeda

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
  --verifier-url "https://api.basescan.org/api" \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  src/DebtRepayer.sol:DebtRepayer
```

## Verify contract

If something went wrong verifying first time

```sh
forge verify-contract \
  --watch \
  --chain 84532 \
  --verifier etherscan \
  --verifier-url "https://api-sepolia.basescan.org/api" \
  --etherscan-api-key $BASESCAN_API_KEY \
  0xe4b0233F06a308B4732282e24ce7aE0c87bdEcbc \
  src/DebtRepayer.sol:DebtRepayer

forge verify-contract \
  --watch \
  --chain 8453 \
  --verifier etherscan \
  --verifier-url "https://api.basescan.org/api" \
  --etherscan-api-key $BASESCAN_API_KEY \
  0x624f2aB0f1DFF2297b9eca320898381Fbba4E3E3 \
  src/DebtRepayer.sol:DebtRepayer
```
