pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_repay_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 23000000;
    }

    function test_repay() public {
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

        assertTrue(currentDebt > 0);
        assertEq(348.113333 ether, current$synthUSDCPosition);
        assertEq(0, current$synthUSDCAvailable);

        vm.prank(ALICE);
        IERC20($USDC).approve(address(positionManager), UINT256_MAX);

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);

        vm.prank(ALICE);
        positionManager.repay(ACCOUNT_ID, uint256(currentDebt - 2 ether));

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        int256 newDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthUSDC);
        uint256 new$synthUSDCPosition = IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthUSDC);
        uint256 new$synthUSDCAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthUSDC);

        assertEq(2 ether, newDebt);
        assertEq(current$synthUSDCPosition, new$synthUSDCPosition);
        assertEq(0, new$synthUSDCAvailable);

        // Calculate dust
        uint256 adjustedUSDCAmount = uint256(currentDebt) * $USDCPrecision / 10 ** 18 + 1; // Add 1 wei of USDC to cover for precision reduction
        uint256 adjustedSynthAmount = adjustedUSDCAmount * $synthUSDCPrecision / $USDCPrecision;
        uint256 dustAmount = adjustedSynthAmount - uint256(currentDebt);

        assertEq(dustAmount, IERC20($synthUSDC).balanceOf(ALICE)); // 0.000000983750013261 ether
    }
}
