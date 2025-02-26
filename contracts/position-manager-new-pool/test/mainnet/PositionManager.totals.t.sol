pragma solidity ^0.8.21;

import "../lib/PositionManagerTest.sol";

contract Mainnet_PositionManager_totals_Test is PositionManagerTest {
    constructor() {
        deployment = "1-main";
        forkUrl = vm.envString("RPC_MAINNET");
        forkBlockNumber = 21921167;
        initialize();
    }

    function test_totals() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = CoreProxy.getCollateralPrice(address($SNX));

        vm.deal(ALICE, 1 ether);
        _deal$SNX(ALICE, 1000 ether);
        _bypassTimeouts(ALICE);

        vm.startPrank(ALICE);
        _setupPosition(100 ether);
        _setupPosition(300 ether);
        _setupPosition(600 ether);

        uint128[] memory accounts = positionManager.getAccounts();
        assertEq(accounts.length, 3, "should have 3 accounts created");

        uint256 loanedAmount = 1000 * snxPrice / 5;

        assertEq(1000 ether, positionManager.getTotalDeposit(), "should have combined deposit of 1000 SNX");
        assertEq(
            loanedAmount, positionManager.getTotalLoan(), "should have combined loan amount of (1000 * snxPrice / 5)"
        );
    }

    function test_for_coverage() public view {
        assertNotEq("", positionManager.onERC721Received(address(0), address(0), 0, ""));
        assertNotEq(address(0), positionManager.getV2xUsd());
    }
}
