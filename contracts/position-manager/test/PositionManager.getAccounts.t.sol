pragma solidity ^0.8.21;

import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {PositionManager} from "src/PositionManager.sol";
import {Test} from "forge-std/src/Test.sol";
import {Vm} from "forge-std/src/Vm.sol";

contract PositionManager_getAccounts_Test is Test {
    address private AccountProxy;

    address private constant WETH_WHALE = 0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8;
    address private constant USDx_WHALE = 0x096A8865367686290639bc50bF8D85C0110d9Fea; // USDe/USDx Wrapper
    bytes32 private constant PYTH_FEED_ETH = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    uint256 fork;

    constructor() {
        string memory root = vm.projectRoot();
        string memory metaPath =
            string.concat(root, "/../../node_modules/@synthetixio/v3-contracts/8453-andromeda/meta.json");
        string memory metaJson = vm.readFile(metaPath);

        AccountProxy = vm.parseJsonAddress(metaJson, ".contracts.AccountProxy");
        vm.label(AccountProxy, "AccountProxy");
    }

    function setUp() public {
        string memory forkUrl = string.concat("https://base-mainnet.infura.io/v3/", vm.envString("INFURA_KEY"));
        fork = vm.createFork(forkUrl, 24837748);
        vm.selectFork(fork);

        // Verify fork
        assertEq(block.number, 24837748);
        assertEq(vm.activeFork(), fork);
    }

    function test_getAccounts_MultipleAccounts() public {
        uint128 ACCOUNT_ID_1 = 528321786804;
        uint128 ACCOUNT_ID_2 = 170141183460469231731687303715884107312;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID_1);
        address ALICE_2 = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID_2);
        assertEq(ALICE, ALICE_2);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        PositionManager positionManager = new PositionManager();
        vm.label(address(positionManager), "PositionManager");

        vm.prank(ALICE);
        uint128[] memory accounts = positionManager.getAccounts(AccountProxy);
        assertEq(accounts.length, 2);
        assertEq(accounts[0], ACCOUNT_ID_1);
        assertEq(accounts[1], ACCOUNT_ID_2);
    }

    function test_getAccounts_NoAccounts() public {
        address ALICE = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045; // Random address

        PositionManager positionManager = new PositionManager();
        vm.label(address(positionManager), "PositionManager");

        vm.prank(ALICE);
        uint128[] memory accounts = positionManager.getAccounts(AccountProxy);

        assertEq(accounts.length, 0);
    }
}
