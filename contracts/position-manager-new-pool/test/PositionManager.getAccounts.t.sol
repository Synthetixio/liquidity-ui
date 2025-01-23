pragma solidity ^0.8.21;

import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_getAccounts_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_getAccounts_MultipleAccounts() public {
        uint128 ACCOUNT_ID_1 = 69;
        uint128 ACCOUNT_ID_2 = 420;
        uint128 ACCOUNT_ID_3 = 1;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID_1);

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID_2));
        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID_3));
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

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
