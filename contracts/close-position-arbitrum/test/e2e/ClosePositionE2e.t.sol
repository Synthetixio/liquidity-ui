pragma solidity ^0.8.21;

import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {ClosePosition} from "src/ClosePosition.sol";
import {MockERC721} from "forge-std/src/mocks/MockERC721.sol";
import {ISynthetixCore} from "src/lib/ISynthetixCore.sol";
import {IUSDToken} from "src/lib/IUSDToken.sol";

contract ClosePositionE2e is Test {
    address private constant USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address private constant ARB = 0x912CE59144191C1204E64559FE8253a0e49E6548;
    address private constant USDx = 0xb2F30A7C980f052f02563fb518dcc39e6bf38175;
    address private constant CORE_PROXY = 0xffffffaEff0B96Ea8e4f94b2253f31abdD875847;
    address private constant ACCOUNT_PROXY = 0x0E429603D3Cb1DFae4E6F52Add5fE82d96d77Dac;
    uint128 private constant poolId = 1;

    address private constant USDxOwner = 0xffffffaEff0B96Ea8e4f94b2253f31abdD875847;
    address private constant negativeDebtSnxUser = 0xc3Cf311e04c1f8C74eCF6a795Ae760dc6312F345;
    uint128 private constant negativeDebtSnxUserAccountId = 58655818123;
    address private constant positiveDebtSnxUser = 0x193641EA463C3B9244cF9F00b77EE5220d4154e9;
    uint128 private constant positiveDebtSnxUserAccountId = 127052930719;

    uint256 private constant MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 private constant startingUSDxAmount = 1000 * 10 ** 18;

    uint256 arbitrumMainnetFork;
    ClosePosition private closePosition;
    MockERC721 private accountProxy;
    ISynthetixCore private coreProxy;
    IUSDToken private usdX;

    function setUp() public {
        arbitrumMainnetFork =
            vm.createSelectFork("https://arbitrum-mainnet.infura.io/v3/8678fe160b1f4d45ad3f3f71502fc57b", 269104835);
        vm.selectFork(arbitrumMainnetFork);

        closePosition = new ClosePosition();
        accountProxy = MockERC721(ACCOUNT_PROXY);
        coreProxy = ISynthetixCore(CORE_PROXY);
        usdX = IUSDToken(USDx);

        vm.startPrank(USDxOwner);
        IUSDToken(USDx).mint(positiveDebtSnxUser, startingUSDxAmount);
    }

    function test_rollFork_thenCorrectBlockAndForkDetails() public {
        assertEq(block.number, 21075973);
        assertEq(vm.activeFork(), arbitrumMainnetFork);
    }

    function test_closePosition_whenNegativeDebt_success() public {
        vm.startPrank(negativeDebtSnxUser);

        uint256 userCollateralAmount;
        uint256 userCollateralValue;
        int256 userDebt;
        uint256 collateralizationRatio;
        uint256 walletBalanceBefore = usdX.balanceOf(negativeDebtSnxUser);
        uint256 depositedAmountBefore = coreProxy.getAccountAvailableCollateral(accountId, address(usdToken));

        (userCollateralAmount, userCollateralValue, userDebt, collateralizationRatio) =
            coreProxy.getPosition(negativeDebtSnxUserAccountId, poolId, USDC);
        assertGt(userCollateralAmount, 0, "Collateral amount should be greater than 0");
        assertGt(userCollateralValue, 0, "Collateral value should be greater than 0");
        assertLt(userDebt, 0, "Debt value should be negative");
        assertEq(collateralizationRatio, MAX_INT, "No Debt Collateral Ratio");

        accountProxy.approve(address(closePosition), negativeDebtSnxUserAccountId);
        closePosition.closePosition(CORE_PROXY, ACCOUNT_PROXY, negativeDebtSnxUserAccountId, poolId, USDC);

        (userCollateralAmount, userCollateralValue, userDebt, collateralizationRatio) =
            coreProxy.getPosition(negativeDebtSnxUserAccountId, poolId, USDC);
        assertEq(userCollateralAmount, 0, "Collateral amount should be 0");
        assertEq(userCollateralValue, 0, "Collateral value should be 0");
        assertEq(userDebt, 0, "Debt should be 0");
        assertEq(collateralizationRatio, MAX_INT, "No Debt Collateral Ratio");
        assertEq(usdX.balanceOf(negativeDebtSnxUser) - walletBalanceBefore, 0, "System USD Token should still be in account");
    }

    function test_closePosition_whenPositiveDebt_success() public {
        vm.startPrank(positiveDebtSnxUser);
        uint256 userCollateralAmount;
        uint256 userCollateralValue;
        int256 userDebtBefore;
        int256 userDebtAfter;
        uint256 collateralizationRatio;

        (userCollateralAmount, userCollateralValue, userDebtBefore, collateralizationRatio) =
            coreProxy.getPosition(positiveDebtSnxUserAccountId, poolId, ARB);
        assertGt(userCollateralAmount, 0, "Collateral amount should be greater than 0");
        assertGt(userCollateralValue, 0, "Collateral value should be greater than 0");
        assertGt(userDebtBefore, 0, "Debt value should be positive");
        assertLt(collateralizationRatio, MAX_INT, "Collateral Ratio is not infinite");

        accountProxy.approve(address(closePosition), positiveDebtSnxUserAccountId);
        usdX.approve(address(closePosition), startingUSDxAmount);
        closePosition.closePosition(CORE_PROXY, ACCOUNT_PROXY, positiveDebtSnxUserAccountId, poolId, ARB);

        (userCollateralAmount, userCollateralValue, userDebtAfter, collateralizationRatio) =
            coreProxy.getPosition(positiveDebtSnxUserAccountId, poolId, ARB);
        assertEq(userCollateralAmount, 0, "Collateral amount should be 0");
        assertEq(userCollateralValue, 0, "Collateral value should be 0");
        assertEq(userDebtAfter, 0, "Debt should be 0");
        assertEq(collateralizationRatio, MAX_INT, "No Debt Collateral Ratio");
        assertEq(startingUSDxAmount - uint256(userDebtBefore), usdX.balanceOf(positiveDebtSnxUser), "USDx wallet balance reduced by paid debt amount");
    }
}
