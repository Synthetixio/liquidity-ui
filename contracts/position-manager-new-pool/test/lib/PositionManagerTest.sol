pragma solidity ^0.8.21;

import {PositionManagerNewPool} from "src/PositionManager.sol";
import {Test} from "forge-std/src/Test.sol";
import {Vm} from "forge-std/src/Vm.sol";
import {console} from "forge-std/src/console.sol";

contract PositionManagerTest is Test {
    address internal CoreProxy;
    address internal AccountProxy;
    address internal TreasuryMarketProxy;

    address internal $SNX;
    address internal $sUSD;

    uint128 internal poolId = 8;

    uint256 internal fork;
    uint256 internal forkBlockNumber;

    PositionManagerNewPool internal positionManager;

    constructor() {
        string memory root = vm.projectRoot();
        string memory metaPath = string.concat(root, "/../../node_modules/@synthetixio/v3-contracts/1-main/meta.json");
        string memory metaJson = vm.readFile(metaPath);

        CoreProxy = vm.parseJsonAddress(metaJson, ".contracts.CoreProxy");
        vm.label(CoreProxy, "CoreProxy");

        AccountProxy = vm.parseJsonAddress(metaJson, ".contracts.AccountProxy");
        vm.label(AccountProxy, "AccountProxy");

        //        TreasuryMarketProxy = vm.parseJsonAddress(metaJson, ".contracts.TreasuryMarketProxy");
        TreasuryMarketProxy = 0x7b952507306E7D983bcFe6942Ac9F2f75C1332D8;
        vm.label(TreasuryMarketProxy, "TreasuryMarketProxy");

        $SNX = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_SNX");
        vm.label($SNX, "$SNX");

        $sUSD = vm.parseJsonAddress(metaJson, ".contracts.USDProxy");
        vm.label($sUSD, "$sUSD");
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
            CoreProxy,
            AccountProxy,
            TreasuryMarketProxy,
            $SNX,
            $sUSD,
            poolId
        );
        vm.label(address(positionManager), "PositionManager");
    }
}
