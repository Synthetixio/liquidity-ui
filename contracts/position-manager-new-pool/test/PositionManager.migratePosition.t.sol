pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";
import "src/ICoreProxyWithMigration.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";

contract PositionManager_migratePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21787552;
    }

    function test_migratePosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        _bypassTimeouts(ALICE);

        uint256 snxPrice = _getSNXPrice();

        _deal$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        uint128 oldPoolId = 1;
        uint128 accountId = CoreProxy.createAccount();

        vm.startPrank(ALICE);
        _setupOldPoolPosition(oldPoolId, accountId, 1000 ether);

        assertEq(
            5 ether,
            CoreProxy.getPositionCollateralRatio(accountId, oldPoolId, address($SNX)),
            "C-Ratio should be exactly 500%"
        );
        CoreProxy.getPositionDebt(accountId, oldPoolId, address($SNX));
        uint256 debtAmount = 1000 * snxPrice / 5;
        assertApproxEqAbs(
            debtAmount, uint256(CoreProxy.getPositionDebt(accountId, oldPoolId, address($SNX))), 0.1 ether
        );
        assertEq(
            1000 ether,
            CoreProxy.getPositionCollateral(accountId, oldPoolId, address($SNX)),
            "SNX position should be 1000"
        );
        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)),
            "Available SNX collateral should be 0"
        );
        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($snxUSD)),
            "Available sUSD should be 0 (after withdrawal)"
        );
        assertEq(
            debtAmount,
            $snxUSD.balanceOf(ALICE),
            "Wallet balance of sUSD should be equal to debt amount (after withdrawal)"
        );

        AccountProxy.approve(address(positionManager), accountId);
        positionManager.migratePosition(oldPoolId, accountId);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        assertEq(
            UINT256_MAX,
            CoreProxy.getPositionCollateralRatio(accountId, oldPoolId, address($SNX)),
            "C-Ratio should be UINT256_MAX"
        );
        assertEq(
            debtAmount,
            TreasuryMarketProxy.loanedAmount(accountId),
            "Loan amount for SNX position should be 200 as previously borrowed amount"
        );
        assertApproxEqAbs(
            1000 * snxPrice / 2,
            uint256(CoreProxy.getPositionDebt(accountId, TreasuryMarketProxy.poolId(), address($SNX))),
            0.1 ether,
            "Virtual debt for SNX position should be at C-Ratio 200%"
        );
        assertEq(
            1000 ether,
            CoreProxy.getPositionCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX)),
            "SNX position should be unchanged at 1000 but in the new pool"
        );
        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)),
            "Available SNX collateral should be unchanged at 0"
        );
        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($snxUSD)),
            "Available sUSD should be unchanged at 0"
        );
        assertEq(
            debtAmount,
            $snxUSD.balanceOf(ALICE),
            "Wallet balance of sUSD should be unchanged and equal initially borrowed amount"
        );
    }
}
