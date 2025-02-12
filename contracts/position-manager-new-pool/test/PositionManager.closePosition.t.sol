pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_closePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21787552;
    }

    function test_closePosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        uint128 accountId = _setupPosition(ALICE, 1000 ether);

        uint256 snxPrice = _getSNXPrice();
        uint256 loanedAmount = 1000 * snxPrice / 5;

        assertEq(
            loanedAmount,
            TreasuryMarketProxy.loanedAmount(accountId),
            "Loan amount for SNX position should be (1000 * snxPrice / 5) as previously borrowed amount"
        );

        // Repayments are made with $sUSD
        _deal$sUSD(ALICE, loanedAmount);
        assertEq(
            //
            loanedAmount,
            $sUSD.balanceOf(ALICE),
            "Wallet balance of sUSD should be at loaned amount (1000 * snxPrice / 5)"
        );

        vm.startPrank(ALICE);
        $sUSD.approve(address(positionManager), loanedAmount);
        AccountProxy.approve(address(positionManager), accountId);
        positionManager.closePosition(accountId);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        assertEq(
            0,
            TreasuryMarketProxy.loanedAmount(accountId),
            "Loan amount for $SNX position should be reduced to 0 after closing position and loan repayment"
        );
        assertEq(
            0,
            CoreProxy.getPositionDebt(accountId, TreasuryMarketProxy.poolId(), address($SNX)),
            "Position debt should be reduced to 0"
        );
        assertEq(
            0,
            CoreProxy.getPositionCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX)),
            "Position collateral should be reduced to 0"
        );
        assertEq(
            0,
            CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)),
            "User account should not have any $SNX available as all the SNX should be transferred to the wallet"
        );
        assertEq(
            0,
            CoreProxy.getAccountAvailableCollateral(accountId, address($snxUSD)),
            "User account should not have any $snxUSD available as all the $snxUSD should be transferred to the wallet"
        );
        assertEq(
            //
            0 ether,
            $sUSD.balanceOf(ALICE),
            "Wallet balance of $sUSD should be at 0 after loan repayment"
        );
        assertEq(
            //
            loanedAmount,
            $snxUSD.balanceOf(ALICE),
            "Wallet balance of $snxUSD should remain at initial loaned amount as loans are repaid in $sUSD"
        );
        assertEq(
            //
            1000 ether,
            $SNX.balanceOf(ALICE),
            "All delegated 1000 $SNX should be returned to the wallet"
        );
    }
}
