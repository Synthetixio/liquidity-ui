pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_setupPosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_setupPosition() public {
        uint128 ACCOUNT_ID = 0;
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(address(CoreProxy));
        $SNX.transfer(ALICE, 1000 ether);
        vm.prank(address(CoreProxy));
        $sUSD.transfer(ALICE, 1000 ether);

        vm.prank(ALICE);
        $SNX.approve(address(positionManager), 888 ether);

        vm.prank(ALICE);
        positionManager.setupPosition(888 ether);

        // Retrieve ACCOUNT_ID via enumeration (index 0, since ALICE owns only one token).
        ACCOUNT_ID = uint128(AccountProxy.tokenOfOwnerByIndex(ALICE, 0));

        assertEq(ALICE, AccountProxy.ownerOf(ACCOUNT_ID));

        assertEq(0, TreasuryMarketProxy.loanedAmount(ACCOUNT_ID));
        assertEq(726.18102984 ether, CoreProxy.getPositionDebt(ACCOUNT_ID, poolId, address($SNX))); // at C-Ratio 200%
        assertEq(888 ether, CoreProxy.getPositionCollateral(ACCOUNT_ID, poolId, address($SNX)));
        assertEq(0, CoreProxy.getAccountAvailableCollateral(ACCOUNT_ID, address($SNX)));
    }
}
