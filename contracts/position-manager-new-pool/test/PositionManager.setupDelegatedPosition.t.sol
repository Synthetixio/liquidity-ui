pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_setupDelegatedPosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21787552;
    }

    function test_setupDelegatedPosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = _getSNXPrice();

        vm.deal(ALICE, 1 ether);
        _deal$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        $SNX.approve(address(positionManager), 1000 ether);

        positionManager.setupDelegatedPosition(1000 ether);
        uint128 accountId = uint128(AccountProxy.tokenOfOwnerByIndex(ALICE, 0));

        uint256 debtAmount = 1000 * snxPrice / 2;
        uint256 loanedAmount = 1000 * snxPrice / 5;

        assertEq(loanedAmount, TreasuryMarketProxy.loanedAmount(accountId));
        assertEq(1000 ether, CoreProxy.getPositionCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX)));
        assertApproxEqAbs(
            debtAmount,
            uint256(CoreProxy.getPositionDebt(accountId, TreasuryMarketProxy.poolId(), address($SNX))),
            0.1 ether
        );
        assertEq(0, CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)));
        assertEq(loanedAmount, CoreProxy.getAccountAvailableCollateral(accountId, address($snxUSD)));
    }
}
