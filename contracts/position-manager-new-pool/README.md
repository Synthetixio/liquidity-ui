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
export _TreasuryMarketProxy=$(cat $_meta | jq -r '.contracts.TreasuryMarketProxy')
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

# Get the readable abi and update importPositionManagerNewPool.ts
node ../../readableAbi.js "$(cat ./out/PositionManager.sol/PositionManagerNewPool.json | jq -c '.metadata.output.abi')"
```

Additional cast commands to setup and configure the new pool

```sh
cast rpc anvil_autoImpersonateAccount true

export _PositionManager="0x6C3F7ed79b9D75486D0250946f7a20BDA74844Ba"

cast selectors $(cast code $_PositionManager)

cast call $_PositionManager 'function AccountProxy() view returns (address)'
cast call $_PositionManager 'function CoreProxy() view returns (address)'
cast call $_PositionManager 'function LegacyMarketProxy() view returns (address)'
cast call $_PositionManager 'function TreasuryMarketProxy() view returns (address)'
cast call $_PositionManager 'function V2xResolver() view returns (address)'

cast call $_PositionManager 'function get$SNX() view returns (address $SNX)'
cast call $_PositionManager 'function get$sUSD() view returns (address $sUSD)'
cast call $_PositionManager 'function get$snxUSD() view returns (address $snxUSD)'
cast call $_PositionManager 'function getV2x() view returns (address v2x)'
cast call $_PositionManager 'function getV2xUsd() view returns (address v2xUsd)'


# Disable timeouts
export _owner=$(cast call $_CoreProxy "function owner() view returns (address)")
export _accountTimeoutWithdraw=$(cast format-bytes32-string 'accountTimeoutWithdraw')
export _senderOverrideMinDelegateTime=$(cast format-bytes32-string 'senderOverrideMinDelegateTime')
export _senderOverrideWithdrawTimeout=$(cast format-bytes32-string 'senderOverrideWithdrawTimeout')

cast send --unlocked --from $_owner $_CoreProxy "function setConfig(bytes32 k, bytes32 v)" \
  "$(cast keccak "$(cast abi-encode "f(bytes32)" $_accountTimeoutWithdraw)")" \
  "$(cast to-uint256 0)"
cast send --unlocked --from $_owner $_CoreProxy "function setConfig(bytes32 k, bytes32 v)" \
  "$(cast keccak "$(cast abi-encode "f(bytes32,address,uint128)" $_senderOverrideMinDelegateTime $_TreasuryMarketProxy "$(cast to-uint256 1)")")" \
  "$(cast to-uint256 1)"
cast send --unlocked --from $_owner $_CoreProxy "function setConfig(bytes32 k, bytes32 v)" \
  "$(cast keccak "$(cast abi-encode "f(bytes32,address,uint128)" $_senderOverrideMinDelegateTime $_PositionManager "$(cast to-uint256 1)")")" \
  "$(cast to-uint256 1)"
cast send --unlocked --from $_owner $_CoreProxy "function setConfig(bytes32 k, bytes32 v)" \
  "$(cast keccak "$(cast abi-encode "f(bytes32,address,uint128)" $_senderOverrideWithdrawTimeout $_TreasuryMarketProxy "$(cast to-uint256 1)")")" \
  "$(cast to-uint256 1)"
cast send --unlocked --from $_owner $_CoreProxy "function setConfig(bytes32 k, bytes32 v)" \
  "$(cast keccak "$(cast abi-encode "f(bytes32,address,uint128)" $_senderOverrideWithdrawTimeout $_PositionManager "$(cast to-uint256 1)")")" \
  "$(cast to-uint256 1)"

# Setup SNX Jubilee pool (no longer needed)
# cast send --unlocked --from $(cast call $_CoreProxy 'function getPoolOwner(uint128 poolId) view returns (address)' $_poolId) $_CoreProxy "function setPoolConfiguration(uint128,tuple(uint128, uint128, int128)[])" $_poolId '[(1,10000000000000000000,1000000000000000000),(3, 90000000000000000000,1000000000000000000)]'
# cast call $_CoreProxy "function getPoolConfiguration(uint128 poolId) view returns (tuple(uint128, uint128, int128)[])" $_poolId

# Fund SNX Jubilee pool with 10k SNX position
export _SNX=$(cast call $_PositionManager 'function get$SNX() view returns (address $SNX)')
export _sUSD=$(cast call $_PositionManager 'function get$sUSD() view returns (address $sUSD)')
export _snxUSD=$(cast call $_PositionManager 'function get$snxUSD() view returns (address $snxUSD)')

cast rpc anvil_setBalance $_CoreProxy $(cast to-wei 10)
cast send --unlocked --from $_CoreProxy $_SNX "function transfer(address to, uint256 amount) returns (bool)" 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 $(cast to-wei 10000)
cast send --unlocked --from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 $_SNX "function approve(address spender, uint256 amount) returns (bool)" $_PositionManager $(cast to-wei 10000)
cast send --unlocked --from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 $_PositionManager "function setupPosition(uint256 snxAmount)" $(cast to-wei 10000)

cast send --unlocked --from $_CoreProxy $_SNX "function transfer(address to, uint256 amount) returns (bool)" 0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345 $(cast to-wei 1000)

cast call --from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 $_PositionManager 'function getTotalDeposit() view returns (uint256 totalDeposit)'
cast call --from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 $_PositionManager 'function getTotalLoan() view returns (uint256 totalLoan)'
cast call --from 0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345 $_PositionManager 'function getTotalDeposit() view returns (uint256 totalDeposit)'
```
