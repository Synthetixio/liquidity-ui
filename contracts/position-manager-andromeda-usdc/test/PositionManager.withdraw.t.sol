pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_withdraw_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 22000000;
    }

    function test_withdraw() public {
        uint128 ACCOUNT_ID = 522433293696;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        // ALICE deposits some snxUSD to test they are withdrawn too
        assertTrue(IERC20($snxUSD).balanceOf(CoreProxy) > 1000 ether);
        vm.prank(CoreProxy);
        IERC20($snxUSD).transfer(ALICE, 1000 ether);
        assertEq(1000 ether, IERC20($snxUSD).balanceOf(ALICE));
        vm.prank(ALICE);
        IERC20($snxUSD).approve(CoreProxy, 1000 ether);
        vm.prank(ALICE);
        ICollateralModule(CoreProxy).deposit(ACCOUNT_ID, $snxUSD, 1000 ether);
        assertEq(1000 ether, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $snxUSD));
        // ALICE account now should have 1000 snxUSD

        uint256 current$USDCBalance = IERC20($USDC).balanceOf(ALICE);
        assertEq(479546, current$USDCBalance); // 0.479546 USDC

        uint256 current$synthUSDCAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthUSDC);
        assertEq(348.113333 ether, current$synthUSDCAvailable);

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);

        vm.prank(ALICE);
        positionManager.withdraw(ACCOUNT_ID);

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        uint256 new$synthUSDCAvailable =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthUSDC);
        assertEq(0, new$synthUSDCAvailable);

        uint256 expected$USDCWithdrawn = current$synthUSDCAvailable * $USDCPrecision / $synthUSDCPrecision
            + 1000 ether * $USDCPrecision / $snxUSDPrecision;

        uint256 new$USDCBalance = IERC20($USDC).balanceOf(ALICE);
        assertEq(current$USDCBalance + expected$USDCWithdrawn, new$USDCBalance);
    }
}
