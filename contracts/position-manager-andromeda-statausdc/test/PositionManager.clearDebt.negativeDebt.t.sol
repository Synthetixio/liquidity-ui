pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";
import {IMarketManagerModule} from "@synthetixio/main/contracts/interfaces/IMarketManagerModule.sol";

contract PositionManager_clearDebt_negativeDebt_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 24976690;
    }

    function test_clearDebt_negativeDebt() public {
        uint128 ACCOUNT_ID = 522433293696;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(AAVE_USDC_POOL);
        IERC20($USDC).transfer(ALICE, 100_000 * $USDCPrecision);

        int256 currentDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 current$synthStataUSDCPosition =
            IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 current$synthStataUSDCAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthStataUSDC);
        uint256 current$snxUSDAvailableSnxUSD = ICollateralModule(CoreProxy).getAccountAvailableCollateral(
            //
            ACCOUNT_ID,
            $snxUSD
        );

        assertTrue(currentDebt < 0);
        // assertEq(-0.780517508859281029 ether, currentDebt);
        assertEq(110 ether, current$synthStataUSDCPosition);
        assertEq(0, current$synthStataUSDCAvailable);
        assertEq(0, current$snxUSDAvailableSnxUSD);

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);

        vm.prank(ALICE);
        positionManager.clearDebt(ACCOUNT_ID);

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        int256 newDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 new$synthStataUSDCPosition =
            IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 new$synthStataUSDCAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthStataUSDC);
        uint256 new$snxUSDAvailable = ICollateralModule(CoreProxy).getAccountAvailableCollateral(
            //
            ACCOUNT_ID,
            $snxUSD
        );

        assertEq(0, newDebt);
        assertEq(current$synthStataUSDCPosition, new$synthStataUSDCPosition);
        assertEq(0, new$synthStataUSDCAvailable);
        assertEq(uint256(-currentDebt), new$snxUSDAvailable); // debt -> minted snxUSD
    }
}
