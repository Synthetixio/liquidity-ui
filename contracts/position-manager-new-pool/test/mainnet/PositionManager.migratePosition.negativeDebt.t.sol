pragma solidity ^0.8.21;

import "../lib/PositionManagerTest.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";

contract PositionManager_migratePosition_negativeDebt_Test is PositionManagerTest {
    constructor() {
        deployment = "1-main";
        forkUrl = vm.envString("RPC_MAINNET");
        forkBlockNumber = 21864281;
        initialize();
    }

    function test_migratePosition() public {
        address ALICE = 0x6C63F89876112e6C7F68e46d9347476E29d5098B;
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = CoreProxy.getCollateralPrice(address($SNX));

        _deal$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        uint128 oldPoolId = 1;
        uint128 accountId = 23599489515;

        int256 debt = CoreProxy.getPositionDebt(accountId, oldPoolId, address($SNX));
        assertGt(0, debt, "debt is actually negative");

        uint256 positionCollateral = CoreProxy.getPositionCollateral(accountId, oldPoolId, address($SNX));
        assertLt(0, positionCollateral, "$SNX position should be positive ");

        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)),
            "Available $SNX collateral should be 0"
        );
        assertEq(
            0, CoreProxy.getAccountAvailableCollateral(accountId, address($snxUSD)), "Available $snxUSD should be 0"
        );
        uint256 $snxUSDWalletBalance = $snxUSD.balanceOf(ALICE);
        assertLt(0, $snxUSDWalletBalance, "wallet has some $snxUSD");

        AccountProxy.approve(address(positionManager), accountId);
        positionManager.migratePosition(oldPoolId, accountId);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        assertEq(0, TreasuryMarketProxy.loanedAmount(accountId), "Loan amount for $SNX position should be 0");

        uint256 targetCratio = TreasuryMarketProxy.targetCratio();
        assertApproxEqAbs(
            (positionCollateral / 1e18) * snxPrice * 1 ether / targetCratio,
            uint256(CoreProxy.getPositionDebt(accountId, TreasuryMarketProxy.poolId(), address($SNX))),
            1 ether,
            "Virtual debt for $SNX position should be at C-Ratio 200%"
        );
        assertEq(
            positionCollateral,
            CoreProxy.getPositionCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX)),
            "$SNX position should be unchanged buy in the new pool"
        );
        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)),
            "Available $SNX collateral should be unchanged at 0"
        );
        assertEq(
            0,
            CoreProxy.getAccountAvailableCollateral(accountId, address($snxUSD)),
            "Available $snxUSD should be 0 as $snxUSD are automatically withdrawn during migration"
        );
        assertEq(
            uint256(-debt) + $snxUSDWalletBalance,
            $snxUSD.balanceOf(ALICE),
            "Wallet balance of $snxUSD should increase by debt amount as negative debt is minted and $snxUSD are automatically withdrawn and send to user wallet during migration"
        );
    }
}
