pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_withdraw_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_withdraw() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        uint128 accountId = _setupPosition(ALICE, 200 ether);

        vm.startPrank(ALICE);
        AccountProxy.approve(address(positionManager), accountId);
        positionManager.closePosition(accountId);

        assertEq(6, CoreProxy.getAccountAvailableCollateral(accountId, address($sUSD)));
        assertEq(200 ether, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));
        assertEq(0 ether, $SNX.balanceOf(ALICE));

        vm.startPrank(ALICE);
        AccountProxy.approve(address(positionManager), accountId);
        positionManager.withdraw(accountId);

        assertEq(0 ether, CoreProxy.getAccountAvailableCollateral(accountId, address($sUSD)));
        assertEq(0 ether, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));
        assertEq(200 ether, $SNX.balanceOf(ALICE));
    }
}
