pragma solidity ^0.8.21;

import {IAccountModule} from "@synthetixio/main/contracts/interfaces/IAccountModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_getAccounts_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_getAccounts_MultipleAccounts() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(ALICE);
        uint128 ACCOUNT_ID_1 = IAccountModule(CoreProxy).createAccount();

        vm.prank(ALICE);
        uint128 ACCOUNT_ID_2 = IAccountModule(CoreProxy).createAccount();

        vm.prank(ALICE);
        uint128 ACCOUNT_ID_3 = IAccountModule(CoreProxy).createAccount();

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID_1));
        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID_2));
        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID_3));

        vm.prank(ALICE);
        uint128[] memory accounts = positionManager.getAccounts();

        assertEq(accounts.length, 3);
        assertEq(accounts[0], ACCOUNT_ID_1);
        assertEq(accounts[1], ACCOUNT_ID_2);
        assertEq(accounts[2], ACCOUNT_ID_3);
    }

    function test_getAccounts_NoAccounts() public {
        address ALICE = vm.addr(0xA11CE);

        vm.prank(ALICE);
        uint128[] memory accounts = positionManager.getAccounts();

        assertEq(accounts.length, 0);
    }
}
