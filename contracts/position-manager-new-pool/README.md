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
lcov --rc derive_function_end_line=0 --remove /tmp/lcov.info -o /tmp/clean.lcov.info '../../node_modules/' 'test/'
genhtml --rc derive_function_end_line=0 /tmp/clean.lcov.info --output-directory coverage
```

To install `genhtml`:

```sh
brew install lcov
```

## Deploy

Sepolia

```sh
export ETHERSCAN_API_KEY=
export ETHERSCAN_API_URL=https://api.etherscan.io/api
export ETHERSCAN_SEPOLIA_API_URL=https://api-sepolia.etherscan.io/api

export _root=$(yarn workspace root exec pwd)
export _meta="$_root/node_modules/@synthetixio/v3-contracts/11155111-main/meta.json"

export _CoreProxy=$(cat $_meta | jq -r '.contracts.CoreProxy')
export _AccountProxy=$(cat $_meta | jq -r '.contracts.AccountProxy')
export _SNX=$(cat $_meta | jq -r '.contracts.CollateralToken_SNX')
export _sUSD=$(cat $_meta | jq -r '.contracts.USDProxy')
export _poolId=8

forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://sepolia.infura.io/v3/$INFURA_API_KEY \
  --chain 84532 \
  --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $ETHERSCAN_SEPOLIA_API_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManagerNewPool \
  --constructor-args \
      $_CoreProxy \
      $_AccountProxy \
      $_SNX \
      $_sUSD \
      $_poolId
```

Mainnet

```sh
export ETHERSCAN_API_KEY=
export ETHERSCAN_API_URL=https://api.etherscan.io/api

export _root=$(yarn workspace root exec pwd)
export _meta="$_root/node_modules/@synthetixio/v3-contracts/1-main/meta.json"

export _CoreProxy=$(cat $_meta | jq -r '.contracts.CoreProxy')
export _AccountProxy=$(cat $_meta | jq -r '.contracts.AccountProxy')
export _SNX=$(cat $_meta | jq -r '.contracts.CollateralToken_SNX')
export _sUSD=$(cat $_meta | jq -r '.contracts.USDProxy')
export _poolId=8

forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://mainnet.infura.io/v3/$INFURA_API_KEY \
  --chain 1 \
  --private-key $MAINNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $ETHERSCAN_API_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManagerNewPool \
  --constructor-args \
      $_CoreProxy \
      $_AccountProxy \
      $_SNX \
      $_sUSD \
      $_poolId
```
