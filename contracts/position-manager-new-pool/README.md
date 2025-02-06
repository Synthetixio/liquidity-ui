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
export _TreasuryMarketProxy=$(cat $_meta | jq -r '.contracts.TreasuryMarketProxy')
export _LegacyMarketProxy=$(cat $_meta | jq -r '.contracts.LegacyMarketProxy')

forge create \
  --broadcast \
  --no-cache \
  --rpc-url https://sepolia.infura.io/v3/$INFURA_API_KEY \
  --chain 11155111 \
  --private-key $TESTNET_DEPLOYER_PRIVATE_KEY \
  --verifier-url $ETHERSCAN_SEPOLIA_API_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/PositionManager.sol:PositionManagerNewPool \
  --constructor-args \
      $_CoreProxy \
      $_AccountProxy \
      $_TreasuryMarketProxy \
      $_LegacyMarketProxy
```

Mainnet

```sh
export ETHERSCAN_API_KEY=
export ETHERSCAN_API_URL=https://api.etherscan.io/api

export _root=$(yarn workspace root exec pwd)
export _meta="$_root/node_modules/@synthetixio/v3-contracts/1-main/meta.json"

export _CoreProxy=$(cat $_meta | jq -r '.contracts.CoreProxy')
export _AccountProxy=$(cat $_meta | jq -r '.contracts.AccountProxy')
export _TreasuryMarketProxy=$(cat $_meta | jq -r '.contracts.TreasuryMarketProxy')
export _LegacyMarketProxy=$(cat $_meta | jq -r '.contracts.LegacyMarketProxy')

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
      $_TreasuryMarketProxy \
      $_LegacyMarketProxy

```

Local

```sh
export _root=$(yarn workspace root exec pwd)
export _meta="$_root/node_modules/@synthetixio/v3-contracts/1-main/meta.json"

export _CoreProxy=$(cat $_meta | jq -r '.contracts.CoreProxy')
export _AccountProxy=$(cat $_meta | jq -r '.contracts.AccountProxy')
export _TreasuryMarketProxy="0x7b952507306E7D983bcFe6942Ac9F2f75C1332D8"
export _LegacyMarketProxy=$(cat $_meta | jq -r '.contracts.LegacyMarketProxy')

export TEST_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

forge create \
  --broadcast \
  --no-cache \
  --private-key $TEST_PK \
  src/PositionManager.sol:PositionManagerNewPool \
  --constructor-args \
      $_CoreProxy \
      $_AccountProxy \
      $_TreasuryMarketProxy \
      $_LegacyMarketProxy
```

Additional cast commands to setup and configure the new pool

```sh
cast rpc anvil_autoImpersonateAccount true

export _PositionManager="0x103416cfCD0D0a32b904Ab4fb69dF6E5B5aaDf2b"

cast selectors $(cast code $_PositionManager)
cast call $_PositionManager "function transferableSynthetixBalanceOf(address walletAddress) returns (uint256 amount)" 0xf7ECaE6F035EA4927FDE97FaA679b5e224afb169


# Disable withdraw timeout
cast call $_CoreProxy "function owner() view returns (address)"
cast call $_CoreProxy "function getPoolOwner(uint128 poolId) view returns (address)" $_poolId
cast send --unlocked --from $(cast call $_CoreProxy "function owner() view returns (address)") $_CoreProxy "function setConfig(bytes32 k, bytes32 v)" "0x6163636f756e7454696d656f7574576974686472617700000000000000000000" "0x0000000000000000000000000000000000000000000000000000000000000000"
cast call $_CoreProxy "function getConfigUint(bytes32 k) view returns (uint256 v)" "0x6163636f756e7454696d656f7574576974686472617700000000000000000000"

# Setup SNX Jubilee pool
export setPoolConfiguration="function setPoolConfiguration(uint128,tuple(uint128, uint128, int128)[])"
cast send --unlocked --from $(cast call $_CoreProxy $getPoolOwner $_poolId) $_CoreProxy $setPoolConfiguration $_poolId '[(1,10000000000000000000,1000000000000000000),(3, 90000000000000000000,1000000000000000000)]'
cast call $_CoreProxy "function getPoolConfiguration(uint128 poolId) view returns (tuple(uint128, uint128, int128)[])" $_poolId

# Fund SNX Jubilee pool with 10k SNX position
cast rpc anvil_setBalance $_CoreProxy $(cast to-wei 10)
cast send --unlocked --from $_CoreProxy $_SNX "function transfer(address to, uint256 amount) returns (bool)" 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 $(cast to-wei 10000)
cast send --unlocked --from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 $_SNX "function approve(address spender, uint256 amount) returns (bool)" $_PositionManager $(cast to-wei 10000)
cast send --unlocked --from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 $_PositionManager "function setupPosition(uint256 snxAmount)" $(cast to-wei 10000)


cast send --unlocked --from $_CoreProxy $_SNX "function transfer(address to, uint256 amount) returns (bool)" 0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345 $(cast to-wei 1000)
```
