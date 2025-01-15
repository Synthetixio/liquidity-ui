pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {AccessError} from "@synthetixio/core-contracts/contracts/errors/AccessError.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_clearDebt_positiveDebt_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 23000000;
    }

    function test_clearDebt_positiveDebt() public {
        uint128 ACCOUNT_ID = 522433293696;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(AAVE_USDC_POOL);
        IERC20($USDC).transfer(ALICE, 100_000 * $USDCPrecision);

        int256 currentDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 currentPosition = IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 currentAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthStataUSDC);

        assertTrue(currentDebt > 0); // 3.029425016249986739 ether
        assertEq(337.605808 ether, currentPosition);
        assertEq(0, currentAvailable);

        vm.prank(ALICE);
        IERC20($USDC).approve(address(positionManager), UINT256_MAX);

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);

        vm.prank(ALICE);
        positionManager.clearDebt(ACCOUNT_ID);

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        int256 newDebt = IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 newPosition = IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $synthStataUSDC);
        uint256 newAvailable = ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthStataUSDC);

        assertEq(0, newDebt);
        assertEq(currentPosition, newPosition);
        assertEq(0, newAvailable);

        // Calculate dust
        uint256 adjustedUSDCAmount = uint256(currentDebt) * $USDCPrecision / 10 ** 18 + 1; // Add 1 wei of USDC to cover for precision reduction
        uint256 adjustedSynthAmount = adjustedUSDCAmount * $synthUSDCPrecision / $USDCPrecision;
        uint256 dustAmount = adjustedSynthAmount - uint256(currentDebt);

        assertEq(dustAmount, IERC20($synthUSDC).balanceOf(ALICE)); // 0.000000983750013261 ether
    }
}
