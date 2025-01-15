pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {IStaticAaveToken} from "src/PositionManager.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_increasePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 24976690;
    }

    function test_increasePosition() public {
        uint128 ACCOUNT_ID = 522433293696;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(AAVE_USDC_POOL);
        IERC20($USDC).transfer(ALICE, 100_000 * $USDCPrecision);

        // -780517508859281029
        int256 currentDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 currentPosition = IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 currentAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthStataUSDC);

        assertTrue(currentDebt < 0);
        assertEq(110 * $synthStataUSDCPrecision, currentPosition);
        assertEq(0, currentAvailable);

        vm.prank(ALICE);
        IERC20($USDC).approve(address(positionManager), UINT256_MAX);

        // Not hardcoding the amount `827888191` based on test block `24976690` stata rate
        // to make test more flexible about starting block.
        // But rather preview deposit result to get the exact stata token amount
        uint256 expectedStataTokenAmount = IStaticAaveToken($stataUSDC).previewDeposit(
            //
            888 * $USDCPrecision
        );
        uint256 expectedStataSynthAmount = expectedStataTokenAmount * $synthStataUSDCPrecision / $stataUSDCPrecision;

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);

        vm.prank(ALICE);
        positionManager.increasePosition(ACCOUNT_ID, 888 * $USDCPrecision);

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        int256 newDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 newPosition = IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 newAvailable = ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthStataUSDC);

        assertEq(currentDebt, newDebt);
        assertEq(expectedStataSynthAmount + currentPosition, newPosition);
        assertEq(0, newAvailable);
    }
}
