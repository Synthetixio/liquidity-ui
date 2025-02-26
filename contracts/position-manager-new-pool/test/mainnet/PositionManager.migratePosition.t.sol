pragma solidity ^0.8.21;

import "../lib/PositionManagerTest.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";

contract Mainnet_PositionManager_migratePosition_Test is PositionManagerTest {
    constructor() {
        deployment = "1-main";
        forkUrl = vm.envString("RPC_MAINNET");
        forkBlockNumber = 21921167;
        initialize();
    }

    function test_migratePosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = CoreProxy.getCollateralPrice(address($SNX));

        _deal$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        uint128 oldPoolId = 1;
        uint128 accountId = CoreProxy.createAccount();

        vm.startPrank(ALICE);

        // Setup SC pool position, borrow and withdraw $snxUSD
        $SNX.approve(address(CoreProxy), 1000 ether);
        CoreProxy.deposit(accountId, address($SNX), 1000 ether);
        CoreProxy.delegateCollateral(accountId, oldPoolId, address($SNX), 1000 ether, 1e18);
        PoolCollateralConfiguration.Data memory poolCollateralConfig =
            CoreProxy.getPoolCollateralConfiguration(oldPoolId, address($SNX));
        uint256 issuanceRatioD18 = poolCollateralConfig.issuanceRatioD18;
        if (issuanceRatioD18 == 0) {
            CollateralConfiguration.Data memory collateralConfig = CoreProxy.getCollateralConfiguration(address($SNX));
            issuanceRatioD18 = collateralConfig.issuanceRatioD18;
        }
        (, uint256 collateralValue,,) = CoreProxy.getPosition(accountId, oldPoolId, address($SNX));
        uint256 mintable$snxUSD = (collateralValue * 1e18) / issuanceRatioD18;
        CoreProxy.mintUsd(accountId, oldPoolId, address($SNX), mintable$snxUSD);

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
            "$SNX position should be 1000"
        );
        assertEq(
            0 ether,
            CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)),
            "Available $SNX collateral should be 0"
        );
        assertEq(
            debtAmount,
            CoreProxy.getAccountAvailableCollateral(accountId, address($snxUSD)),
            "Available $snxUSD should be equal to debt amount"
        );
        assertEq(0, $snxUSD.balanceOf(ALICE), "Wallet balance of $snxUSD should be 0");

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
            "Loan amount for $SNX position should be 200 as previously borrowed amount"
        );
        uint256 targetCratio = TreasuryMarketProxy.targetCratio();
        assertApproxEqAbs(
            1000 * snxPrice * 1 ether / targetCratio,
            uint256(CoreProxy.getPositionDebt(accountId, TreasuryMarketProxy.poolId(), address($SNX))),
            0.1 ether,
            "Virtual debt for $SNX position should be at C-Ratio 200%"
        );
        assertEq(
            1000 ether,
            CoreProxy.getPositionCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX)),
            "$SNX position should be unchanged at 1000 but in the new pool"
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
            debtAmount,
            $snxUSD.balanceOf(ALICE),
            "Wallet balance of $snxUSD should be equal to debt amount as $snxUSD are automatically withdrawn and send to user wallet during migration"
        );
    }
}
