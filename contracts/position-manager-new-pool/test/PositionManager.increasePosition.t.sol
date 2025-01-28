pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";

contract PositionManager_increasePosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21684537;
    }

    function test_increasePosition() public {
        uint128 ACCOUNT_ID = 0;
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.startPrank(address(CoreProxy));

        $SNX.transfer(ALICE, 1000 ether);
        $sUSD.transfer(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        $SNX.approve(address(positionManager), 200 ether);

        positionManager.setupPosition(200 ether);

        ACCOUNT_ID = uint128(AccountProxy.tokenOfOwnerByIndex(ALICE, 0));
        assertEq(ALICE, AccountProxy.ownerOf(ACCOUNT_ID));

        assertEq(0, TreasuryMarketProxy.loanedAmount(ACCOUNT_ID));
        assertEq(163.554286 ether, CoreProxy.getPositionDebt(ACCOUNT_ID, poolId, address($SNX))); // at C-Ratio 200%
        assertEq(200 ether, CoreProxy.getPositionCollateral(ACCOUNT_ID, poolId, address($SNX)));
        assertEq(0, CoreProxy.getAccountAvailableCollateral(ACCOUNT_ID, address($SNX)));

        // Increase position by 500 SNX

        AccountProxy.approve(address(positionManager), ACCOUNT_ID);
        $SNX.approve(address(positionManager), 500 ether);
        positionManager.increasePosition(ACCOUNT_ID, 500 ether);

        assertEq(ALICE, AccountProxy.ownerOf(ACCOUNT_ID));

        assertEq(0, TreasuryMarketProxy.loanedAmount(ACCOUNT_ID));
        assertEq(572.440001 ether, CoreProxy.getPositionDebt(ACCOUNT_ID, poolId, address($SNX))); // at C-Ratio 200%
        assertEq(700 ether, CoreProxy.getPositionCollateral(ACCOUNT_ID, poolId, address($SNX)));
        assertEq(0, CoreProxy.getAccountAvailableCollateral(ACCOUNT_ID, address($SNX)));
    }
}
