pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_setupPosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_setupPosition() public {
        uint128 ACCOUNT_ID = 0;
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(CoreProxy);
        IERC20($SNX).transfer(ALICE, 1000 ether);
        vm.prank(CoreProxy);
        IERC20($sUSD).transfer(ALICE, 1000 ether);

        vm.prank(ALICE);
        IERC20($SNX).approve(address(positionManager), UINT256_MAX);

        vm.prank(ALICE);
        positionManager.setupPosition(888 ether);

        // Retrieve ACCOUNT_ID via enumeration (index 0, since ALICE owns only one token).
        ACCOUNT_ID = uint128(IAccountTokenModule(AccountProxy).tokenOfOwnerByIndex(ALICE, 0));

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        assertEq(0, IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, poolId, $SNX));
        assertEq(888 ether, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, poolId, $SNX));
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $SNX));
    }
}
