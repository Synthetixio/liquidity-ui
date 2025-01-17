pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_setupPosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 24976690;
    }

    function test_setupPosition() public {
        uint128 ACCOUNT_ID = 0;
        uint128 POOL_ID = 1;
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(AAVE_USDC_POOL);
        IERC20($USDC).transfer(ALICE, 100_000 * $USDCPrecision);

        assertEq(0, IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, $synthUSDC));
        assertEq(0, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, $synthUSDC));
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthUSDC));

        vm.prank(ALICE);
        IERC20($USDC).approve(address(positionManager), UINT256_MAX);

        vm.prank(ALICE);
        positionManager.setupPosition(888 * $USDCPrecision);

        // Retrieve ACCOUNT_ID via enumeration (index 0, since ALICE owns only one token).
        ACCOUNT_ID = uint128(IAccountTokenModule(AccountProxy).tokenOfOwnerByIndex(ALICE, 0));

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        assertEq(0, IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, $synthUSDC));
        assertEq(
            888 * $synthUSDCPrecision, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, $synthUSDC)
        );
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthUSDC));
    }
}
