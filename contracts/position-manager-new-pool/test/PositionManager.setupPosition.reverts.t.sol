pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";
import "src/PositionManager.sol";

contract PositionManager_setupPosition_reverts_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_setupPosition_NotEnoughBalance() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(PositionManagerNewPool.NotEnoughBalance.selector, ALICE, $SNX, 100 ether, 0 ether)
        );
        positionManager.setupPosition(100 ether);
    }

    function test_setupPosition_NotEnoughAllowance() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        _deal$SNX(ALICE, 100 ether);

        // NotEnoughAllowance error when not enough SNX approval for PositionManager
        vm.expectRevert(
            abi.encodeWithSelector(PositionManagerNewPool.NotEnoughAllowance.selector, ALICE, $SNX, 100 ether, 0 ether)
        );
        vm.prank(ALICE);
        positionManager.setupPosition(100 ether);
    }

    function test_setupPosition_AccountExists() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        _setupPosition(ALICE, 200 ether);

        _deal$SNX(ALICE, 100 ether);
        $SNX.approve(address(positionManager), 100 ether);

        vm.prank(ALICE);
        vm.expectRevert(abi.encodeWithSelector(PositionManagerNewPool.AccountExists.selector));
        positionManager.setupPosition(100 ether);
    }
}
