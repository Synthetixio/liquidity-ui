pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_closePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21787552;
    }

    function _setupPosition(address walletAddress, uint256 amount) internal returns (uint128 accountId) {
        uint256 ts = vm.getBlockTimestamp();

        // Go back 1 week to bypass the 1 week Min Delegation restriction
        vm.warp(ts - 86_400 * 7 - 1);

        vm.deal(walletAddress, 1 ether);

        _deal$SNX(walletAddress, amount);

        vm.startPrank(walletAddress);
        $SNX.approve(address(positionManager), amount);

        positionManager.setupPosition(amount);

        accountId = uint128(AccountProxy.tokenOfOwnerByIndex(walletAddress, 0));
        assertEq(walletAddress, AccountProxy.ownerOf(accountId));
        vm.stopPrank();

        // Return to present
        vm.warp(ts);
    }

    function test_closePosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        _deal$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);
        $SNX.approve(address(positionManager), 1000 ether);

        // Go back 1 week to bypass the 1 week Min Delegation restriction
        uint256 ts = vm.getBlockTimestamp();
        vm.warp(ts - 86_400 * 7 - 1);
        positionManager.setupPosition(1000 ether);
        // Return to present
        vm.warp(ts);

        uint128 accountId = uint128(AccountProxy.tokenOfOwnerByIndex(ALICE, 0));

        uint256 snxPrice = CoreProxy.getCollateralPrice(address($SNX));
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
