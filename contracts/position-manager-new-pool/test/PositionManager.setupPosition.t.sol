pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_setupPosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_setupPosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        uint128 accountId = _setupPosition(ALICE, 200 ether);

        assertEq(0, TreasuryMarketProxy.loanedAmount(accountId));
        assertEq(155.822705 ether, CoreProxy.getPositionDebt(accountId, poolId, address($SNX))); // at C-Ratio 200%
        assertEq(200 ether, CoreProxy.getPositionCollateral(accountId, poolId, address($SNX)));
        assertEq(0, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));
    }
}
