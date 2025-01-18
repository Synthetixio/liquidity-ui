pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";
import {PositionManagerAndromedaStataUSDC} from "src/PositionManager.sol";

contract PositionManager_setupPosition_reverts_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 23000000;
    }

    function test_setupPosition_reverts() public {
        uint128 ACCOUNT_ID = 522433293696;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        // AccountExists error when setting up position for user that already has an account
        vm.expectRevert(abi.encodeWithSelector(PositionManagerAndromedaStataUSDC.AccountExists.selector));
        vm.prank(ALICE);
        positionManager.setupPosition(100 ether);
    }
}
