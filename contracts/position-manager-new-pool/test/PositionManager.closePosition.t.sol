pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_closePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21787552;
    }

    function test_closePosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        uint128 accountId = _setupPosition(ALICE, 200 ether);

        vm.startPrank(ALICE);
        AccountProxy.approve(address(positionManager), accountId);
        positionManager.closePosition(accountId);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        assertEq(0, TreasuryMarketProxy.loanedAmount(accountId));
        assertEq(0, CoreProxy.getPositionDebt(accountId, TreasuryMarketProxy.poolId(), address($SNX))); // at C-Ratio 200%
        assertEq(0, CoreProxy.getPositionCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX)));
        assertEq(200 ether, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));
    }
}
