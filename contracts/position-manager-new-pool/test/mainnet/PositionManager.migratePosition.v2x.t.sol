pragma solidity ^0.8.21;

import "../lib/PositionManagerTest.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";

contract Mainnet_PositionManager_migratePosition_v2x_Test is PositionManagerTest {
    constructor() {
        deployment = "1-main";
        forkUrl = vm.envString("RPC_MAINNET");
        forkBlockNumber = 21921167;
        initialize();
    }

    function test_migratePosition_v2x() public {
        address ALICE = 0xa5758de121079D2FA868C64b02Ef35C909635f16;
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = CoreProxy.getCollateralPrice(address($SNX));

        uint256 collateral = V2x.collateral(ALICE);
        uint256 cratio = V2x.collateralisationRatio(ALICE);
        uint256 collateralValue = collateral * snxPrice / 10 ** 18;
        uint256 debt = collateralValue * cratio / 10 ** 18;

        assertLt(0, V2x.balanceOf(ALICE), "V2x SNX balance should be > 0");
        assertLt(0, collateral, "V2x SNX collateral should be > 0");
        assertLt(0, cratio, "V2x staking C-Ratio should be > 0");
        assertLt(0, debt, "V2x debt should be > 0");

        assertEq(TreasuryMarketProxy.poolId(), CoreProxy.getPreferredPool());

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

        uint256 targetCratio = TreasuryMarketProxy.targetCratio();
        uint256 positionDebt = collateralValue * 1 ether / targetCratio;
        assertApproxEqAbs(
            positionDebt,
            uint256(CoreProxy.getPositionDebt(accountId, TreasuryMarketProxy.poolId(), address($SNX))),
            0.1 ether,
            "Virtual debt for SNX position should be half of collateral value (C-Ratio 200%)"
        );
        assertEq(
            collateral,
            CoreProxy.getPositionCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX)),
            "SNX position collateral amount should be unchanged in the new pool"
        );
    }
}
