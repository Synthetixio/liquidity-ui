pragma solidity ^0.8.21;

import {ICoreProxy, MarketConfiguration} from "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";
import {IAccountProxy} from "@synthetixio/v3-contracts/1-main/IAccountProxy.sol";
import {IAddressResolver} from "src/IAddressResolver.sol";
import {ITreasuryMarketProxy} from "src/ITreasuryMarketProxy.sol";
import {IUSDProxy} from "@synthetixio/v3-contracts/1-main/IUSDProxy.sol";
import {ILegacyMarketProxy} from "@synthetixio/v3-contracts/1-main/ILegacyMarketProxy.sol";
import {IV2x} from "@synthetixio/v3-contracts/1-main/IV2x.sol";
import {IV2xUsd} from "@synthetixio/v3-contracts/1-main/IV2xUsd.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {IAddressResolver} from "src/IAddressResolver.sol";

import {PositionManagerNewPool} from "src/PositionManager.sol";
import {Test} from "forge-std/src/Test.sol";
import {Vm} from "forge-std/src/Vm.sol";
import {console} from "forge-std/src/console.sol";

contract PositionManagerTest is Test {
    ICoreProxy internal CoreProxy;
    IAccountProxy internal AccountProxy;
    ITreasuryMarketProxy internal TreasuryMarketProxy;
    ILegacyMarketProxy internal LegacyMarketProxy;
    IV2x internal V2x;
    IAddressResolver internal V2xResolver;

    IERC20 internal $SNX;
    IERC20 internal $snxUSD;
    IERC20 internal $sUSD;

    uint256 internal fork;
    uint256 internal forkBlockNumber;

    PositionManagerNewPool internal positionManager;

    constructor() {
        string memory root = vm.projectRoot();
        string memory metaPath = string.concat(root, "/../../node_modules/@synthetixio/v3-contracts/1-main/meta.json");
        string memory metaJson = vm.readFile(metaPath);

        CoreProxy = ICoreProxy(vm.parseJsonAddress(metaJson, ".contracts.CoreProxy"));
        vm.label(address(CoreProxy), "CoreProxy");

        AccountProxy = IAccountProxy(vm.parseJsonAddress(metaJson, ".contracts.AccountProxy"));
        vm.label(address(AccountProxy), "AccountProxy");

        TreasuryMarketProxy = ITreasuryMarketProxy(vm.parseJsonAddress(metaJson, ".contracts.TreasuryMarketProxy"));
        vm.label(address(TreasuryMarketProxy), "TreasuryMarketProxy");

        LegacyMarketProxy = ILegacyMarketProxy(vm.parseJsonAddress(metaJson, ".contracts.LegacyMarketProxy"));
        vm.label(address(LegacyMarketProxy), "LegacyMarketProxy");
    }

    function setUp() public {
        string memory forkUrl = vm.envString("RPC_MAINNET");
        //        string memory forkUrl = "http://127.0.0.1:8545";
        fork = vm.createFork(forkUrl, forkBlockNumber);
        //        fork = vm.createFork(forkUrl);
        vm.selectFork(fork);

        // Verify fork
        assertEq(block.number, forkBlockNumber);
        assertEq(vm.activeFork(), fork);

        // Pyth bypass
        vm.etch(0x1234123412341234123412341234123412341234, "FORK");

        positionManager = new PositionManagerNewPool(
            //
            address(CoreProxy),
            address(AccountProxy),
            address(TreasuryMarketProxy),
            address(LegacyMarketProxy)
        );
        vm.label(address(positionManager), "PositionManager");

        $SNX = IERC20(positionManager.get$SNX());
        vm.label(address($SNX), "$SNX");

        $snxUSD = IERC20(positionManager.get$snxUSD());
        vm.label(address($snxUSD), "$snxUSD");

        $sUSD = IERC20(positionManager.get$sUSD());
        vm.label(address($sUSD), "$sUSD");

        V2x = IV2x(positionManager.getV2x());
        vm.label(address(V2x), "V2x");

        V2xResolver = IAddressResolver(positionManager.V2xResolver());
        vm.label(address(V2xResolver), "V2xResolver");

        // _configurePool(); // Temporary until deployed
        _disableAccountActivityTimeoutPending();
        _fundPool();
    }

    //    function _configurePool() internal {
    //        MarketConfiguration.Data[] memory configs = new MarketConfiguration.Data[](2);
    //        configs[0] = MarketConfiguration.Data(LegacyMarketProxy.marketId(), 10 ether, 1 ether);
    //        configs[1] = MarketConfiguration.Data(TreasuryMarketProxy.marketId(), 90 ether, 1 ether);
    //
    //        uint128 poolId = 8;
    //        vm.prank(CoreProxy.getPoolOwner(poolId));
    //        CoreProxy.setPoolConfiguration(poolId, configs);
    //        CoreProxy.getPoolConfiguration(poolId);
    //    }

    function _deal$SNX(address walletAddress, uint256 amount) internal {
        $SNX.balanceOf(walletAddress);
        $SNX.balanceOf(address(CoreProxy));

        vm.prank(address(CoreProxy));
        $SNX.transfer(walletAddress, amount);
    }

    function _deal$snxUSD(address walletAddress, uint256 amount) internal {
        $snxUSD.balanceOf(walletAddress);
        $snxUSD.balanceOf(address(CoreProxy));

        vm.prank(address(CoreProxy));
        $snxUSD.transfer(walletAddress, amount);
    }

    function _deal$sUSD(address walletAddress, uint256 amount) internal {
        address SynthRedeemer = V2xResolver.getAddress("SynthRedeemer");

        $sUSD.balanceOf(walletAddress);
        $sUSD.balanceOf(SynthRedeemer);

        vm.prank(SynthRedeemer);
        $sUSD.transfer(walletAddress, amount);
    }

    function _fundPool() internal {
        address B055 = vm.addr(0xB055);
        vm.label(B055, "0xB055");
        _setupPosition(B055, 10_000 ether);
    }

    function _disableAccountActivityTimeoutPending() internal {
        assertEq(86_400, CoreProxy.getConfigUint("accountTimeoutWithdraw"));
        vm.prank(CoreProxy.owner());
        CoreProxy.setConfig("accountTimeoutWithdraw", 0);
        assertEq(0, CoreProxy.getConfigUint("accountTimeoutWithdraw"));
    }

    function _setupPosition(address walletAddress, uint256 amount) internal returns (uint128 accountId) {
        uint256 ts = vm.getBlockTimestamp();

        // Go back 1 week to bypass the 1 week Min Delegation restriction
        vm.warp(ts - 86_400 * 7 - 1);

        vm.deal(walletAddress, 1 ether);

        _deal$SNX(walletAddress, amount);

        vm.startPrank(walletAddress);
        $SNX.approve(address(positionManager), amount);

        positionManager.setupPosition(amount);

        accountId = uint128(AccountProxy.tokenOfOwnerByIndex(walletAddress, 0));
        assertEq(walletAddress, AccountProxy.ownerOf(accountId));
        vm.stopPrank();

        // Return to present
        vm.warp(ts);
    }

    function _setupOldPoolPosition(uint128 oldPoolId, uint128 accountId, uint256 amount) internal {
        uint256 ts = vm.getBlockTimestamp();

        // Go back 1 week to bypass the 1 week Min Delegation restriction
        vm.warp(ts - 86_400 * 7 - 1);

        // Setup old pool position, borrow and withdraw sUSD
        $SNX.approve(address(CoreProxy), amount);
        CoreProxy.deposit(accountId, address($SNX), amount);
        CoreProxy.delegateCollateral(accountId, oldPoolId, address($SNX), amount, 1e18);
        CoreProxy.mintUsd(accountId, oldPoolId, address($SNX), amount / 5);
        CoreProxy.withdraw(accountId, address($snxUSD), amount / 5);

        // Return to present
        vm.warp(ts);

        // vm.startPrank(CoreProxy.owner());
        // CoreProxy.setConfig(
        //     keccak256(abi.encode("accountOverrideMinDelegateTime", accountId, 1)),
        //     0x0000000000000000000000000000000000000000000000000000000000000001
        // );
    }

    function _updateMinDelegationTime() internal {
        MarketConfiguration.Data[] memory marketConfigs = CoreProxy.getPoolConfiguration(TreasuryMarketProxy.poolId());
        for (uint256 i = 0; i < marketConfigs.length; i++) {
            assertEq(0, CoreProxy.getMarketMinDelegateTime(marketConfigs[i].marketId));
            vm.prank(CoreProxy.getMarketAddress(marketConfigs[i].marketId));
            CoreProxy.setMarketMinDelegateTime(marketConfigs[i].marketId, 1);
            assertEq(1, CoreProxy.getMarketMinDelegateTime(marketConfigs[i].marketId));
        }
    }

    function _generateAccountId() internal view returns (uint128 accountId) {
        // Use multiple sources of randomness to increase unpredictability
        uint256 randomSeed = uint256(blockhash(block.number - 1));

        // Generate a random number in the range [0, type(uint128).max]
        // Using uint256 for intermediate calculations
        uint256 maxUint128PlusOne = (uint256(1) << 128); // 2^128
        uint256 randomNumber = randomSeed % maxUint128PlusOne;

        // Define the desired range
        uint128 lowerBound = type(uint128).max / 4;
        uint128 upperBound = type(uint128).max / 2;

        // Ensure the number is within the specified range
        if (randomNumber < lowerBound) {
            return lowerBound + uint128((uint256(randomNumber) % (upperBound - lowerBound)));
        } else if (randomNumber > upperBound) {
            return lowerBound + uint128((uint256(randomNumber) % (upperBound - lowerBound)));
        } else {
            return uint128(randomNumber);
        }
    }

    function _getSNXPrice() internal view returns (uint256 snxPrice) {
        snxPrice = CoreProxy.getCollateralPrice(address($SNX));
    }
}
