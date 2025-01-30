pragma solidity ^0.8.21;

import {ICoreProxy, MarketConfiguration} from "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";
import {IAccountProxy} from "@synthetixio/v3-contracts/1-main/IAccountProxy.sol";
import {ITreasuryMarketProxy} from "src/ITreasuryMarketProxy.sol";
import {IUSDProxy} from "@synthetixio/v3-contracts/1-main/IUSDProxy.sol";
import {ISNX} from "src/ISNX.sol";

import {PositionManagerNewPool} from "src/PositionManager.sol";
import {Test} from "forge-std/src/Test.sol";
import {Vm} from "forge-std/src/Vm.sol";
import {console} from "forge-std/src/console.sol";

contract PositionManagerTest is Test {
    ICoreProxy internal CoreProxy;
    IAccountProxy internal AccountProxy;
    ITreasuryMarketProxy internal TreasuryMarketProxy;

    ISNX internal $SNX;
    IUSDProxy internal $sUSD;

    uint128 internal poolId = 8;

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

        //        TreasuryMarketProxy = vm.parseJsonAddress(metaJson, ".contracts.TreasuryMarketProxy");
        TreasuryMarketProxy = ITreasuryMarketProxy(0x7b952507306E7D983bcFe6942Ac9F2f75C1332D8);
        vm.label(address(TreasuryMarketProxy), "TreasuryMarketProxy");

        $SNX = ISNX(vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_SNX"));
        vm.label(address($SNX), "$SNX");

        $sUSD = IUSDProxy(vm.parseJsonAddress(metaJson, ".contracts.USDProxy"));
        vm.label(address($sUSD), "$sUSD");
    }

    function setUp() public {
        //        string memory forkUrl = vm.envString("RPC_MAINNET");
        string memory forkUrl = "http://127.0.0.1:8545";
        //        fork = vm.createFork(forkUrl, forkBlockNumber);
        fork = vm.createFork(forkUrl);
        vm.selectFork(fork);

        // Verify fork
        //        assertEq(block.number, forkBlockNumber);
        assertEq(vm.activeFork(), fork);

        // Pyth bypass
        // vm.etch(0x1234123412341234123412341234123412341234, "FORK");

        positionManager = new PositionManagerNewPool(
            //
            address(CoreProxy),
            address(AccountProxy),
            address(TreasuryMarketProxy),
            address($SNX),
            address($sUSD),
            poolId
        );
        vm.label(address(positionManager), "PositionManager");

        _configurePool(); // Temporary until deployed
        _disableAccountActivityTimeoutPending();
        _fundPool();
    }

    function _configurePool() internal {
        MarketConfiguration.Data[] memory configs = new MarketConfiguration.Data[](1);
        configs[0] = MarketConfiguration.Data(3, 1 ether, 1 ether);

        vm.prank(CoreProxy.getPoolOwner(poolId));
        CoreProxy.setPoolConfiguration(poolId, configs);
        CoreProxy.getPoolConfiguration(poolId);
    }

    function _get$SNX(address walletAddress, uint256 amount) internal {
        vm.prank(address(CoreProxy));
        $SNX.transfer(walletAddress, amount);
    }

    function _get$sUSD(address walletAddress, uint256 amount) internal {
        vm.prank(address(CoreProxy));
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
        vm.deal(walletAddress, 1 ether);

        _get$SNX(walletAddress, amount);

        vm.startPrank(walletAddress);
        $SNX.approve(address(positionManager), amount);

        positionManager.setupPosition(amount);

        accountId = uint128(AccountProxy.tokenOfOwnerByIndex(walletAddress, 0));
        assertEq(walletAddress, AccountProxy.ownerOf(accountId));
        vm.stopPrank();
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
        CoreProxy.withdraw(accountId, address($sUSD), amount / 5);

        // Return to present
        vm.warp(ts);

        // vm.startPrank(CoreProxy.owner());
        // CoreProxy.setConfig(
        //     keccak256(abi.encode("accountOverrideMinDelegateTime", accountId, 1)),
        //     0x0000000000000000000000000000000000000000000000000000000000000001
        // );
    }

    function _updateMinDelegationTime() internal {
        MarketConfiguration.Data[] memory marketConfigs = CoreProxy.getPoolConfiguration(poolId);
        for (uint256 i = 0; i < marketConfigs.length; i++) {
            assertEq(0, CoreProxy.getMarketMinDelegateTime(marketConfigs[i].marketId));
            vm.prank(CoreProxy.getMarketAddress(marketConfigs[i].marketId));
            CoreProxy.setMarketMinDelegateTime(marketConfigs[i].marketId, 1);
            assertEq(1, CoreProxy.getMarketMinDelegateTime(marketConfigs[i].marketId));
        }
    }
}
