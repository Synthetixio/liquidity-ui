pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";
import "src/PositionManager.sol";

contract PositionManager_increasePosition_reverts_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21787552;
    }

    function test_increasePosition_Unauthorized() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        uint128 accountId = _setupPosition(ALICE, 200 ether);

        // Unauthorised error transferring Account NFT without approval
        vm.expectRevert(abi.encodeWithSelector(ICoreProxy.Unauthorized.selector, address(positionManager)));
        vm.prank(ALICE);
        positionManager.repayLoan(accountId, 1 ether);

        vm.prank(ALICE);
        AccountProxy.approve(address(positionManager), accountId);
    }
}
