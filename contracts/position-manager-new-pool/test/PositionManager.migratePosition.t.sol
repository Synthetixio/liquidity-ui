pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";
import "src/ICoreProxyWithMigration.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";

contract PositionManager_migratePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_migratePosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        _get$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        uint128 oldPoolId = 1;
        uint128 accountId = CoreProxy.createAccount();
        _setupOldPoolPosition(oldPoolId, accountId, 1000 ether);

        assertEq(
            7.79113525 ether,
            CoreProxy.getPositionCollateralRatio(accountId, oldPoolId, address($SNX)),
            "C-Ratio should be > 500%"
        );
        assertEq(
            200 ether,
            CoreProxy.getPositionDebt(accountId, oldPoolId, address($SNX)),
            "Debt for SNX position should be 200"
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
            CoreProxy.getAccountAvailableCollateral(accountId, address($sUSD)),
            "Available sUSD should be 0 (after withdrawal)"
        );
        assertEq(200 ether, $sUSD.balanceOf(ALICE), "Wallet balance of sUSD should be 200");

        AccountProxy.approve(address(positionManager), accountId);
        positionManager.migratePosition(oldPoolId, accountId);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        assertEq(
            UINT256_MAX,
            CoreProxy.getPositionCollateralRatio(accountId, oldPoolId, address($SNX)),
            "C-Ratio should be UINT256_MAX"
        );
        assertEq(
            200 ether,
            TreasuryMarketProxy.loanedAmount(accountId),
            "Loan amount for SNX position should be 200 as previously borrowed amount"
        );
        assertEq(
            779.113525 ether,
            CoreProxy.getPositionDebt(accountId, poolId, address($SNX)),
            "Virtual debt for SNX position should be 779.113525 at C-Ratio 200%"
        );
        assertEq(
            1000 ether,
            CoreProxy.getPositionCollateral(accountId, poolId, address($SNX)),
            "SNX position should be unchanged at 1000 but in the new pool"
        );
        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)),
            "Available SNX collateral should be unchanged at 0"
        );
        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($sUSD)),
            "Available sUSD should be unchanged at 0"
        );
        assertEq(200 ether, $sUSD.balanceOf(ALICE), "Wallet balance of sUSD should be unchanged at 200");
    }
}
