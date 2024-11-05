// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {DebtRepayer} from "src/DebtRepayer.sol";
import {ISynthetixCore} from "src/lib/ISynthetixCore.sol";
import {ISpotMarket} from "src/lib/ISpotMarket.sol";
import {IAccountProxy} from "src/lib/IAccountProxy.sol";
import {IERC20} from "src/lib/IERC20.sol";
import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";

contract DebtRepayerTest is Test {
    uint256 fork;
    uint128 private constant poolId = 1;
    uint128 private constant spotMarketId = 1;
    uint256 private constant startingUSDTokenAmount = 1000 * 10 ** 18;

    address private CoreProxy;
    address private SpotMarket;
    address private AccountProxy;
    address private CollateralTokenUSDC;
    address private CollateralTokenSUSDC;
    address private USDToken;

    DebtRepayer private debtRepayer;
    ISynthetixCore private coreProxy;
    ISpotMarket private spotMarket;
    IAccountProxy private accountProxy;

    address private constant negativeDebtUser = 0x46fA849093eC68D2aC1CeAB47fC278fD74DcD57C;
    uint128 private constant negativeDebtAccountId = 40706955487;
    address private constant positiveDebtUser = 0x40b202FCd036709DA5393bf329b4d7A7D2997806;
    uint128 private constant positiveDebtAccountId = 1213123123;
    address private constant USDCWhale = 0x3304E22DDaa22bCdC5fCa2269b418046aE7b566A;

    constructor() {
        string memory root = vm.projectRoot();
        string memory metaPath =
            string.concat(root, "/../../node_modules/@synthetixio/v3-contracts/8453-andromeda/meta.json");
        string memory metaJson = vm.readFile(metaPath);
        CoreProxy = vm.parseJsonAddress(metaJson, ".contracts.CoreProxy");
        SpotMarket = vm.parseJsonAddress(metaJson, ".contracts.SpotMarketProxy");
        AccountProxy = vm.parseJsonAddress(metaJson, ".contracts.AccountProxy");
        CollateralTokenUSDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_USDC");
        CollateralTokenSUSDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_sUSDC");
        USDToken = vm.parseJsonAddress(metaJson, ".contracts.USDProxy");
    }

    function setUp() public {
        string memory forkUrl = string.concat("https://base-mainnet.infura.io/v3/", vm.envString("INFURA_KEY"));
        fork = vm.createFork(forkUrl, 21781780);
        vm.selectFork(fork);

        debtRepayer = new DebtRepayer();
        coreProxy = ISynthetixCore(CoreProxy);
        spotMarket = ISpotMarket(SpotMarket);
        accountProxy = IAccountProxy(AccountProxy);
    }

    function test_rollFork_thenCorrectBlockAndForkDetails() public {
        assertEq(block.number, 21781780);
        assertEq(vm.activeFork(), fork);
    }

    function test_repayDebt_positiveDebt_success() public {
        vm.startPrank(USDCWhale);
        IERC20(CollateralTokenUSDC).transfer(positiveDebtUser, 60000000);

        vm.startPrank(positiveDebtUser);

        uint256 userUSDCBalanceBefore = IERC20(CollateralTokenUSDC).balanceOf(positiveDebtUser);
        int256 userDebtBefore;
        (,, userDebtBefore,) = coreProxy.getPosition(positiveDebtAccountId, poolId, CollateralTokenSUSDC);

        assertGt(userDebtBefore, 0, "Debt should be greater than zero");

        accountProxy.approve(address(debtRepayer), positiveDebtAccountId);
        IERC20(CollateralTokenUSDC).approve(address(debtRepayer), 60000000);

        debtRepayer.depositDebtToRepay(
            CoreProxy, SpotMarket, AccountProxy, positiveDebtAccountId, poolId, CollateralTokenSUSDC, spotMarketId
        );

        uint256 userUSDCBalanceAfter = IERC20(CollateralTokenUSDC).balanceOf(positiveDebtUser);
        int256 userDebtAfter;
        (,, userDebtAfter,) = coreProxy.getPosition(positiveDebtAccountId, poolId, CollateralTokenSUSDC);

        assertEq(userDebtAfter, 0, "Debt should be repaid fully");
        uint256 decimalDifference = 1e12;
        uint256 debtPaid = (userUSDCBalanceBefore - userUSDCBalanceAfter) * decimalDifference;
        assertApproxEqAbs(debtPaid, uint256(userDebtBefore), 1e12, "Debt paid should equal balance change");
    }

    function test_repayDebt_negativeDebt_success() public {
        vm.startPrank(negativeDebtUser);
        uint256 depositedAmountBefore = coreProxy.getAccountAvailableCollateral(negativeDebtAccountId, USDToken);
        int256 userDebtBefore;
        (,, userDebtBefore,) = coreProxy.getPosition(negativeDebtAccountId, poolId, CollateralTokenSUSDC);

        accountProxy.approve(address(debtRepayer), negativeDebtAccountId);
        debtRepayer.depositDebtToRepay(
            CoreProxy, SpotMarket, AccountProxy, negativeDebtAccountId, poolId, CollateralTokenSUSDC, spotMarketId
        );

        uint256 depositedAmountAfter = coreProxy.getAccountAvailableCollateral(negativeDebtAccountId, USDToken);
        int256 userDebtAfter;
        (,, userDebtAfter,) = coreProxy.getPosition(negativeDebtAccountId, poolId, CollateralTokenSUSDC);

        assertEq(
            depositedAmountAfter - depositedAmountBefore,
            uint256(-userDebtBefore),
            "Debt paid should equal balance change"
        );
    }
}
