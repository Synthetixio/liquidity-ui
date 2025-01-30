pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";
import "src/ICoreProxyWithMigration.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";

contract PositionManager_repayLoan_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_repayLoan() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        _get$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        uint128 oldPoolId = 1;
        uint128 accountId = CoreProxy.createAccount();
        _setupOldPoolPosition(oldPoolId, accountId, 1000 ether);

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
            //
            200 ether,
            $sUSD.balanceOf(ALICE),
            "Wallet balance of sUSD should be unchanged at 200"
        );

        AccountProxy.approve(address(positionManager), accountId);
        $sUSD.approve(address(positionManager), 50 ether);
        positionManager.repayLoan(accountId, 50 ether);

        assertEq(
            150 ether,
            TreasuryMarketProxy.loanedAmount(accountId),
            "Loan amount for SNX position should be 150 after $50 loan repayment"
        );
        assertEq(
            //
            150 ether,
            $sUSD.balanceOf(ALICE),
            "Wallet balance of sUSD should be at 150 after $50 loan repayment"
        );
    }
}
