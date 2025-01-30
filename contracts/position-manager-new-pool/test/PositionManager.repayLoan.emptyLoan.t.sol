pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_repayLoan_emptyLoan_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_repayLoan_emptyLoan() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        uint128 accountId = _setupPosition(ALICE, 200 ether);

        assertEq(0 ether, TreasuryMarketProxy.loanedAmount(accountId));
        assertEq(155.822705 ether, CoreProxy.getPositionDebt(accountId, poolId, address($SNX))); // at C-Ratio 200%
        assertEq(200 ether, CoreProxy.getPositionCollateral(accountId, poolId, address($SNX)));
        assertEq(0 ether, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));

        vm.startPrank(ALICE);
        AccountProxy.approve(address(positionManager), accountId);
        positionManager.repayLoan(accountId, 100 ether);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        // Technically nothing changed because account had no loan
        assertEq(0 ether, TreasuryMarketProxy.loanedAmount(accountId));
        assertEq(155.822705 ether, CoreProxy.getPositionDebt(accountId, poolId, address($SNX))); // at C-Ratio 200%
        assertEq(200 ether, CoreProxy.getPositionCollateral(accountId, poolId, address($SNX)));
        assertEq(0 ether, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));
    }
}
