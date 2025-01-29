pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_increasePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_increasePosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        uint128 accountId = _setupPosition(ALICE, 200 ether);

        assertEq(0, TreasuryMarketProxy.loanedAmount(accountId));
        assertEq(150.456236 ether, CoreProxy.getPositionDebt(accountId, poolId, address($SNX))); // at C-Ratio 200%
        assertEq(200 ether, CoreProxy.getPositionCollateral(accountId, poolId, address($SNX)));
        assertEq(0, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));

        // Increase position by 500 SNX

        _get$SNX(ALICE, 500 ether);

        vm.startPrank(ALICE);
        AccountProxy.approve(address(positionManager), accountId);
        $SNX.approve(address(positionManager), 500 ether);
        positionManager.increasePosition(accountId, UINT256_MAX);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        assertEq(0, TreasuryMarketProxy.loanedAmount(accountId));
        assertEq(526.596826 ether, CoreProxy.getPositionDebt(accountId, poolId, address($SNX))); // at C-Ratio 200%
        assertEq(700 ether, CoreProxy.getPositionCollateral(accountId, poolId, address($SNX)));
        assertEq(0, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));
    }
}
