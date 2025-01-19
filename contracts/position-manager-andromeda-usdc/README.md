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

Base Sepolia

```sh
export BASESCAN_API_KEY=
export BASESCAN_SEPOLIA_API_URL=https://api-sepolia.basescan.org/api

export _root=$(yarn workspace root exec pwd)
export _meta="$_root/node_modules/@synthetixio/v3-contracts/84532-andromeda/meta.json"
export _spotMarkets="$_root/node_modules/@synthetixio/v3-contracts/84532-andromeda/spotMarkets.json"

export _CoreProxy=$(cat $_meta | jq -r '.contracts.CoreProxy')
export _AccountProxy=$(cat $_meta | jq -r '.contracts.AccountProxy')
export _SpotMarketProxy=$(cat $_meta | jq -r '.contracts.SpotMarketProxy')
export _USDC=$(cat $_meta | jq -r '.contracts.CollateralToken_fUSDC')
export _synthUSDC=$(cat $_meta | jq -r '.contracts.SynthToken_sUSDC')
export _synthIdUSDC="1"
export _poolId=1

forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://base-sepolia.infura.io/v3/$INFURA_API_KEY \
  --chain 84532 \
  --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $BASESCAN_SEPOLIA_API_URL \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManagerAndromedaUSDC \
  --constructor-args \
      $_CoreProxy \
      $_AccountProxy \
      $_SpotMarketProxy \
      $_USDC \
      $_synthUSDC \
      $_synthIdUSDC \
      $_poolId
```

Base Mainnet

```sh
export BASESCAN_API_KEY=
export BASESCAN_API_URL=https://api.basescan.org/api

export _root=$(yarn workspace root exec pwd)
export _meta="$_root/node_modules/@synthetixio/v3-contracts/8453-andromeda/meta.json"
export _spotMarkets="$_root/node_modules/@synthetixio/v3-contracts/8453-andromeda/spotMarkets.json"

export _CoreProxy=$(cat $_meta | jq -r '.contracts.CoreProxy')
export _AccountProxy=$(cat $_meta | jq -r '.contracts.AccountProxy')
export _SpotMarketProxy=$(cat $_meta | jq -r '.contracts.SpotMarketProxy')
export _USDC=$(cat $_meta | jq -r '.contracts.CollateralToken_USDC')
export _synthUSDC=$(cat $_meta | jq -r '.contracts.SynthToken_sUSDC')
export _synthIdUSDC="1"
export _poolId=1

forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://base-mainnet.infura.io/v3/$INFURA_API_KEY \
  --chain 8453 \
  --private-key $MAINNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $BASESCAN_API_URL \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManagerAndromedaUSDC \
  --constructor-args \
      $_CoreProxy \
      $_AccountProxy \
      $_SpotMarketProxy \
      $_USDC \
      $_synthUSDC \
      $_synthIdUSDC \
      $_poolId
```
