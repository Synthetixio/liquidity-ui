pragma solidity ^0.8.21;

import "../lib/PositionManagerTest.sol";

contract Mainnet_PositionManager_setupPosition_Test is PositionManagerTest {
    constructor() {
        deployment = "1-main";
        forkUrl = vm.envString("RPC_MAINNET");
        forkBlockNumber = 21921167;
        initialize();
    }

    function test_setupPosition() public {
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");

        uint256 snxPrice = CoreProxy.getCollateralPrice(address($SNX));

        vm.deal(ALICE, 1 ether);
        _deal$SNX(ALICE, 1000 ether);

        vm.startPrank(ALICE);

        $SNX.approve(address(positionManager), 1000 ether);

        positionManager.setupPosition(1000 ether);
        uint128 accountId = uint128(AccountProxy.tokenOfOwnerByIndex(ALICE, 0));

        uint256 targetCratio = TreasuryMarketProxy.targetCratio();
        uint256 debtAmount = 1000 * snxPrice * 1 ether / targetCratio;
        uint256 loanedAmount = 1000 * snxPrice / 5;

        assertEq(
            loanedAmount,
            TreasuryMarketProxy.loanedAmount(accountId),
            "account loan amount should be 0.2 of provided liquidity value (1000 * snxPrice / 5)"
        );
        assertEq(
            1000 ether,
            CoreProxy.getPositionCollateral(accountId, TreasuryMarketProxy.poolId(), address($SNX)),
            "account should have 1000 $SNX position in Delegated Staking pool"
        );
        assertApproxEqAbs(
            debtAmount,
            uint256(CoreProxy.getPositionDebt(accountId, TreasuryMarketProxy.poolId(), address($SNX))),
            0.1 ether,
            "account virtual debt should be equal to half of provided liquidity value (1000 * snxPrice / targetCratio)"
        );
        assertEq(
            0,
            CoreProxy.getAccountAvailableCollateral(accountId, address($SNX)),
            "account should not have any $SNX available as it is all delegated"
        );
        assertEq(
            0,
            CoreProxy.getAccountAvailableCollateral(accountId, address($snxUSD)),
            "account should not have any $snxUSD available as it is all sent to user wallet"
        );
        assertEq(
            loanedAmount,
            $snxUSD.balanceOf(ALICE),
            "should get all the loaned $snxUSD in the wallet immediately, the amount is the same as loaned amount (1000 * snxPrice / 5) "
        );
    }
}
