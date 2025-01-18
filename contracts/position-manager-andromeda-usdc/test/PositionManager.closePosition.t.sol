pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";
import {IMarketManagerModule} from "@synthetixio/main/contracts/interfaces/IMarketManagerModule.sol";

contract PositionManager_closePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 24976690;
    }

    function test_closePosition() public {
        uint128 ACCOUNT_ID = 522433293696;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(AAVE_USDC_POOL);
        IERC20($USDC).transfer(ALICE, 100_000 * $USDCPrecision);

        int256 currentDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthUSDC);
        uint256 current$synthUSDCPosition =
            IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthUSDC);
        uint256 current$synthUSDCAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthUSDC);

        uint256 currentAvailableSnxUSD = ICollateralModule(CoreProxy).getAccountAvailableCollateral(
            //
            ACCOUNT_ID,
            $snxUSD
        );

        assertTrue(currentDebt < 0);
        // assertEq(-0.794260632799140725 ether, currentDebt);
        assertEq(120 ether, current$synthUSDCPosition);
        assertEq(0, current$synthUSDCAvailable);
        assertEq(0, currentAvailableSnxUSD);

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);

        vm.prank(ALICE);
        positionManager.closePosition(ACCOUNT_ID);

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        int256 newDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthUSDC);
        uint256 new$synthUSDCPosition = IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthUSDC);
        uint256 new$synthUSDCAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthUSDC);
        uint256 new$snxUSDAvailable = ICollateralModule(CoreProxy).getAccountAvailableCollateral(
            //
            ACCOUNT_ID,
            $snxUSD
        );

        assertEq(0, newDebt);
        assertEq(0, new$synthUSDCPosition);
        assertEq(current$synthUSDCPosition, new$synthUSDCAvailable);
        assertEq(uint256(-currentDebt), new$snxUSDAvailable); // debt -> minted snxUSD
    }
}
