pragma solidity ^0.8.21;

import {
    ICoreProxy,
    PoolCollateralConfiguration,
    CollateralConfiguration,
    MarketConfiguration
} from "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";
import {IAccountProxy} from "@synthetixio/v3-contracts/1-main/IAccountProxy.sol";
import {IAddressResolver} from "src/IAddressResolver.sol";
import {ITreasuryMarketProxy} from "@synthetixio/v3-contracts/1-main/ITreasuryMarketProxy.sol";
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
        //        string memory forkUrl = vm.envString("RPC_MAINNET");
        string memory forkUrl = "http://127.0.0.1:8545";
        //        fork = vm.createFork(forkUrl, forkBlockNumber);
        fork = vm.createFork(forkUrl);
        vm.selectFork(fork);

        // Verify fork
        //        assertEq(block.number, forkBlockNumber);
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
        _bypassTimeouts(address(positionManager));
        _bypassTimeouts(address(TreasuryMarketProxy));
        _fundPool();
    }

    function _bypassTimeouts(address addr) internal {
        vm.startPrank(CoreProxy.owner());
        CoreProxy.setConfig(
            keccak256(abi.encode(bytes32("senderOverrideMinDelegateTime"), addr, uint128(1))),
            0x0000000000000000000000000000000000000000000000000000000000000001
        );
        CoreProxy.setConfig(
            keccak256(abi.encode(bytes32("senderOverrideMinDelegateTime"), addr, TreasuryMarketProxy.poolId())),
            0x0000000000000000000000000000000000000000000000000000000000000001
        );
        CoreProxy.setConfig(
            keccak256(abi.encode(bytes32("senderOverrideWithdrawTimeout"), addr)),
            0x0000000000000000000000000000000000000000000000000000000000000001
        );
        vm.stopPrank();
    }

    function _deal$SNX(address walletAddress, uint256 amount) internal {
        $SNX.balanceOf(walletAddress);
        $SNX.balanceOf(address(CoreProxy));

        vm.startPrank(address(CoreProxy));
        $SNX.transfer(walletAddress, amount);
        vm.stopPrank();
    }

    function _deal$snxUSD(address walletAddress, uint256 amount) internal {
        $snxUSD.balanceOf(walletAddress);
        $snxUSD.balanceOf(address(CoreProxy));

        vm.startPrank(address(CoreProxy));
        $snxUSD.transfer(walletAddress, amount);
        vm.stopPrank();
    }

    function _deal$sUSD(address walletAddress, uint256 amount) internal {
        address SynthRedeemer = V2xResolver.getAddress("SynthRedeemer");

        $sUSD.balanceOf(walletAddress);
        $sUSD.balanceOf(SynthRedeemer);

        vm.startPrank(SynthRedeemer);
        $sUSD.transfer(walletAddress, amount);
        vm.stopPrank();
    }

    function _fundPool() internal {
        address B055 = vm.addr(0xB055);
        vm.label(B055, "0xB055");

        vm.deal(B055, 1 ether);

        _deal$SNX(B055, 10_000 ether);

        vm.startPrank(B055);

        uint128 accountId = CoreProxy.createAccount();

        TreasuryMarketProxy.rebalance();
        $SNX.approve(address(CoreProxy), 10_000 ether);
        CoreProxy.deposit(accountId, address($SNX), 10_000 ether);
        CoreProxy.delegateCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX), 10_000 ether, 1e18);
        TreasuryMarketProxy.saddle(accountId);

        vm.stopPrank();
    }
}
