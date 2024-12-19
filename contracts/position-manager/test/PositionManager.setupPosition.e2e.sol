pragma solidity ^0.8.21;

import {PythERC7412Wrapper} from "@synthetixio/pyth-erc7412-wrapper/contracts/PythERC7412Wrapper.sol";
import {IUSDTokenModule} from "@synthetixio/main/contracts/interfaces/IUSDTokenModule.sol";
import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {ICollateralConfigurationModule} from "@synthetixio/main/contracts/interfaces/ICollateralConfigurationModule.sol";
import {PositionManager} from "src/PositionManager.sol";
import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";

contract PositionManager_setupPosition_Test is Test {
    address private USDProxy;
    address private CoreProxy;
    address private AccountProxy;
    address private PythERC7412WrapperAddress;
    address private CollateralToken_ARB;
    address private CollateralToken_USDC;
    address private CollateralToken_WETH;
    uint128 private constant poolId = 1;

    uint256 private constant MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 private constant startingUSDProxyAmount = 1000 * 10 ** 18;

    uint256 fork;

    constructor() {
        string memory root = vm.projectRoot();
        string memory metaPath =
            string.concat(root, "/../../node_modules/@synthetixio/v3-contracts/42161-main/meta.json");
        string memory metaJson = vm.readFile(metaPath);
        USDProxy = vm.parseJsonAddress(metaJson, ".contracts.USDProxy");
        AccountProxy = vm.parseJsonAddress(metaJson, ".contracts.AccountProxy");
        CoreProxy = vm.parseJsonAddress(metaJson, ".contracts.CoreProxy");
        PythERC7412WrapperAddress = vm.parseJsonAddress(metaJson, ".contracts.PythERC7412Wrapper");
        CollateralToken_ARB = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_ARB");
        CollateralToken_USDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_USDC");
        CollateralToken_WETH = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_WETH");
    }

    function setUp() public {
        string memory forkUrl = string.concat("https://arbitrum-mainnet.infura.io/v3/", vm.envString("INFURA_KEY"));
        fork = vm.createFork(forkUrl, 285545346);
        vm.selectFork(fork);

        // Pyth bypass
        vm.etch(0x1234123412341234123412341234123412341234, "FORK");
    }

    function test_rollFork_thenCorrectBlockAndForkDetails() public {
        assertEq(block.number, 21419019);
        assertEq(vm.activeFork(), fork);
    }

    function xtest_setupPosition_success() public {
        ALICE = vm.addr(0xA11CE);
        vm.startPrank(ALICE);

        uint256 walletBalanceBefore = IUSDTokenModule(USDProxy).balanceOf(negativeDebtSnxUser);
        uint256 depositedAmountBefore =
            ICollateralModule(CoreProxy).getAccountAvailableCollateral(negativeDebtSnxUserAccountId, USDProxy);

        uint256 userCollateralAmount;
        uint256 userCollateralValue;
        int256 userDebt;
        uint256 collateralizationRatio;

        (userCollateralAmount, userCollateralValue, userDebt, collateralizationRatio) =
            IVaultModule(CoreProxy).getPosition(negativeDebtSnxUserAccountId, poolId, CollateralToken_USDC);
        assertGt(userCollateralAmount, 0, "Collateral amount should be greater than 0");
        assertGt(userCollateralValue, 0, "Collateral value should be greater than 0");
        assertLt(userDebt, 0, "Debt value should be negative");
        assertEq(collateralizationRatio, MAX_INT, "No Debt Collateral Ratio");

        PositionManager closePosition = new PositionManager();

        IAccountTokenModule(AccountProxy).approve(address(closePosition), negativeDebtSnxUserAccountId);

        closePosition.closePosition(CoreProxy, AccountProxy, negativeDebtSnxUserAccountId, poolId, CollateralToken_USDC);

        (userCollateralAmount, userCollateralValue, userDebt, collateralizationRatio) =
            IVaultModule(CoreProxy).getPosition(negativeDebtSnxUserAccountId, poolId, CollateralToken_USDC);
        console.log("userCollateralAmount", userCollateralAmount);
        console.log("userCollateralValue", userCollateralValue);
        console.log("userDebt", userDebt);
        console.log("collateralizationRatio", collateralizationRatio);
        assertEq(userCollateralAmount, 0, "Collateral amount should be 0");
        assertEq(userCollateralValue, 0, "Collateral value should be 0");
        assertEq(userDebt, 0, "Debt should be 0");
        assertEq(collateralizationRatio, MAX_INT, "No Debt Collateral Ratio");
        assertEq(
            IUSDTokenModule(USDProxy).balanceOf(negativeDebtSnxUser) - walletBalanceBefore,
            0,
            "System USD Token should still be in account"
        );
    }
}
