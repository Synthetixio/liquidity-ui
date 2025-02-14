pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_totals_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21787552;
    }

    function test_totals() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = CoreProxy.getCollateralPrice(address($SNX));

        vm.deal(ALICE, 1 ether);
        _deal$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        $SNX.approve(address(positionManager), 1000 ether);
        positionManager.setupPosition(100 ether);
        positionManager.setupPosition(300 ether);
        positionManager.setupPosition(600 ether);

        uint128[] memory accounts = positionManager.getAccounts();
        assertEq(accounts.length, 3, "should have 3 accounts created");

        uint256 loanedAmount = 1000 * snxPrice / 5;

        assertEq(1000 ether, positionManager.getTotalDeposit(), "should have combined deposit of 1000 SNX");
        assertEq(
            loanedAmount, positionManager.getTotalLoan(), "should have combined loan amount of (1000 * snxPrice / 5)"
        );
    }
}
