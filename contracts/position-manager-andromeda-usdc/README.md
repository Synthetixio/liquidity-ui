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

# node_modules/@synthetixio/v3-contracts/8453-andromeda/meta.json
# node_modules/@synthetixio/v3-contracts/8453-andromeda/spotMarkets.json
export _CoreProxy="0x764F4C95FDA0D6f8114faC54f6709b1B45f919a1"
export _AccountProxy="0x9EB560Cc26c2766929A41F8e46E87bd4b8b145d9"
export _SpotMarketProxy="0xaD2fE7cd224c58871f541DAE01202F93928FEF72"
export _USDC="0xc43708f8987Df3f3681801e5e640667D86Ce3C30"
export _synthUSDC="0x8069c44244e72443722cfb22DcE5492cba239d39"
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
  src/PositionManager.sol:PositionManager \
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

# node_modules/@synthetixio/v3-contracts/8453-andromeda/meta.json
# node_modules/@synthetixio/v3-contracts/8453-andromeda/spotMarkets.json
export _CoreProxy="0x32C222A9A159782aFD7529c87FA34b96CA72C696"
export _AccountProxy="0x63f4Dd0434BEB5baeCD27F3778a909278d8cf5b8"
export _SpotMarketProxy="0x18141523403e2595D31b22604AcB8Fc06a4CaA61"
export _USDC="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
export _synthUSDC="0xC74eA762cF06c9151cE074E6a569a5945b6302E7"
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
  src/PositionManager.sol:PositionManager \
  --constructor-args \
      $_CoreProxy \
      $_AccountProxy \
      $_SpotMarketProxy \
      $_USDC \
      $_synthUSDC \
      $_synthIdUSDC \
      $_poolId
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
