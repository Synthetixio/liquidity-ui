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

        // Just for logging
        assertEq(289_498.456246835038781189 ether, V2x.balanceOf(ALICE), "V2x SNX balance should be ~289_498");
        assertEq(293_946.924326705539796859 ether, V2x.collateral(ALICE), "V2x SNX collateral should be ~293_946");
        assertEq(0.393005539052230194 ether, V2x.collateralisationRatio(ALICE), "V2x staking C-Ratio should be ~0.393");

        // Update preferred pool, because legacy market migration will migrate to preferred pool only
        vm.prank(CoreProxy.owner());
        CoreProxy.setPreferredPool(poolId);
        assertEq(poolId, CoreProxy.getPreferredPool());

        uint128 accountId = 888;
        vm.startPrank(ALICE);
        LegacyMarketProxy.migrate(accountId);
        TreasuryMarketProxy.saddle(accountId);

        assertEq(ALICE, AccountProxy.ownerOf(accountId));

        assertEq(
            180_010.704244416353469663 ether,
            TreasuryMarketProxy.loanedAmount(accountId),
            "Loan amount for SNX position should be 200 as previously borrowed amount"
        );
        assertEq(
            229_018.024375087804748158 ether,
            CoreProxy.getPositionDebt(accountId, poolId, address($SNX)),
            "Virtual debt for SNX position should be ~229_018 at C-Ratio 200%"
        );
        assertEq(
            293_946.924326705539796859 ether,
            CoreProxy.getPositionCollateral(accountId, poolId, address($SNX)),
            "SNX position should be unchanged at ~293_946 but in the new pool"
        );
    }
}
