pragma solidity ^0.8.21;

import "./lib/PositionManagerTest.sol";
import "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";
import "src/PositionManager.sol";

contract PositionManager_closePosition_reverts_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 21787552;
    }

    //    function test_closePosition_Unauthorized() public {
    //        address ALICE = vm.addr(0xA11CE);
    //        vm.label(ALICE, "0xA11CE");
    //
    //        uint128 accountId = _setupPosition(ALICE, 1000 ether);
    //
    //        vm.startPrank(ALICE);
    //
    //        // Unauthorised error transferring Account NFT without approval
    //        vm.expectRevert(abi.encodeWithSelector(ICoreProxy.Unauthorized.selector, address(positionManager)));
    //        positionManager.closePosition(accountId);
    //    }

    function test_closePosition_NotEnoughBalance() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = _getSNXPrice();
        uint256 loanedAmount = 1000 * snxPrice / 5;

        uint128 accountId = _setupPosition(ALICE, 1000 ether);

        vm.startPrank(ALICE);
        AccountProxy.approve(address(positionManager), accountId);

        vm.expectRevert(
            abi.encodeWithSelector(
                PositionManagerNewPool.NotEnoughBalance.selector, ALICE, address($sUSD), loanedAmount, 0 ether
            )
        );
        positionManager.closePosition(accountId);
    }

    function test_closePosition_NotEnoughAllowance() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = _getSNXPrice();
        uint256 loanedAmount = 1000 * snxPrice / 5;
        uint128 accountId = _setupPosition(ALICE, 1000 ether);

        _deal$sUSD(ALICE, loanedAmount);

        vm.startPrank(ALICE);
        AccountProxy.approve(address(positionManager), accountId);

        // NotEnoughAllowance error when not enough SNX approval for PositionManager
        vm.expectRevert(
            abi.encodeWithSelector(
                PositionManagerNewPool.NotEnoughAllowance.selector, ALICE, address($sUSD), loanedAmount, 0 ether
            )
        );
        positionManager.closePosition(accountId);
    }
}
