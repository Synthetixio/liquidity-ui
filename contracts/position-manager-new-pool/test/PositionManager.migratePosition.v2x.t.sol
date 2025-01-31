pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";
import "src/ICoreProxyWithMigration.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";

contract PositionManager_migratePosition_v2x_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_migratePosition_v2x() public {
        address ALICE = 0xf7ECaE6F035EA4927FDE97FaA679b5e224afb169;
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = _getSNXPrice();

        uint256 collateral = V2x.collateral(ALICE);
        uint256 cratio = V2x.collateralisationRatio(ALICE);
        uint256 collateralValue = collateral * snxPrice / 10 ** 18;
        uint256 debt = collateralValue * cratio / 10 ** 18;

        assertLt(0, V2x.balanceOf(ALICE), "V2x SNX balance should be > 0");
        assertLt(0, collateral, "V2x SNX collateral should be > 0");
        assertLt(0, cratio, "V2x staking C-Ratio should be > 0");
        assertLt(0, debt, "V2x debt should be > 0");

        // Update preferred pool, because legacy market migration will migrate to preferred pool only
        vm.prank(CoreProxy.owner());
        CoreProxy.setPreferredPool(poolId);
        assertEq(poolId, CoreProxy.getPreferredPool());

        uint128 accountId = 888;
        vm.startPrank(ALICE);
        LegacyMarketProxy.migrate(accountId);
        TreasuryMarketProxy.saddle(accountId);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        assertApproxEqAbs(
            debt,
            TreasuryMarketProxy.loanedAmount(accountId),
            0.1 ether,
            "Loan amount for SNX position should be equal to v2x debt"
        );

        uint256 positionDebt = collateralValue / 2; // at c-ratio 200%
        assertApproxEqAbs(
            positionDebt,
            uint256(CoreProxy.getPositionDebt(accountId, poolId, address($SNX))),
            0.1 ether,
            "Virtual debt for SNX position should be half of collateral value (C-Ratio 200%)"
        );
        assertEq(
            collateral,
            CoreProxy.getPositionCollateral(accountId, poolId, address($SNX)),
            "SNX position collateral amount should be unchanged in the new pool"
        );
    }
}
