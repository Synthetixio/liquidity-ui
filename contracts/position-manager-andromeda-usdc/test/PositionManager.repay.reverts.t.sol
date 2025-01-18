pragma solidity ^0.8.21;

import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {AccessError} from "@synthetixio/core-contracts/contracts/errors/AccessError.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerAndromedaUSDC} from "src/PositionManager.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_repay_reverts_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 23000000;
    }

    function test_repay_reverts() public {
        uint128 ACCOUNT_ID = 522433293696;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        // Unauthorised error transferring Account NFT without approval
        vm.expectRevert(abi.encodeWithSelector(AccessError.Unauthorized.selector, address(positionManager)));
        vm.prank(ALICE);
        positionManager.repay(ACCOUNT_ID, 1 ether);

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);

        // NotEnoughAllowance error when not enough USDC approval for PositionManager
        vm.expectRevert(
            abi.encodeWithSelector(
                PositionManagerAndromedaUSDC.NotEnoughAllowance.selector,
                ALICE,
                $USDC,
                1 ether * $USDCPrecision / $synthUSDCPrecision + 1, // Add 1 wei of USDC to cover for precision reduction
                0 ether
            )
        );
        vm.prank(ALICE);
        positionManager.repay(ACCOUNT_ID, 1 ether);

        vm.prank(ALICE);
        IERC20($USDC).approve(address(positionManager), UINT256_MAX);

        // NotEnoughBalance error when not enough USDC in the wallet
        vm.prank(ALICE);
        vm.expectRevert(
            abi.encodeWithSelector(
                PositionManagerAndromedaUSDC.NotEnoughBalance.selector,
                ALICE,
                $USDC,
                1 ether * $USDCPrecision / $synthUSDCPrecision + 1, // Add 1 wei of USDC to cover for precision reduction
                0.1 ether * $USDCPrecision / $synthUSDCPrecision
            )
        );
        positionManager.repay(ACCOUNT_ID, 1 ether);

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));
    }
}
