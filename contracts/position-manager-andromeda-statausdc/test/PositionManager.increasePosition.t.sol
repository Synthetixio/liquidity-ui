pragma solidity ^0.8.21;

import {PythERC7412Wrapper} from "@synthetixio/pyth-erc7412-wrapper/contracts/PythERC7412Wrapper.sol";
import {IUSDTokenModule} from "@synthetixio/main/contracts/interfaces/IUSDTokenModule.sol";
import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountModule} from "@synthetixio/main/contracts/interfaces/IAccountModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {ICollateralConfigurationModule} from "@synthetixio/main/contracts/interfaces/ICollateralConfigurationModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManager, IStaticAaveToken} from "src/PositionManager.sol";
import {Test} from "forge-std/src/Test.sol";
import {Vm} from "forge-std/src/Vm.sol";
import {console} from "forge-std/src/console.sol";

contract PositionManager_increasePosition_Test is Test {
    address private coreProxyAddress;
    address private accountProxyAddress;
    address private spotMarketProxyAddress;

    address private $USDC;
    address private $sUSDC;
    address private $stataUSDC;
    address private $sStataUSDC;

    uint128 private poolId = 1;
    uint128 private synthMarketId_sUSDC = 1;
    uint128 private synthMarketId_sStataUSDC = 3;

    address private constant AAVE_USDC_POOL = 0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB; // Aave: aBasUSDC Token

    uint256 private $USDC_Precision;
    uint256 private $stataUSDC_Precision;
    uint256 private $sStataUSDC_Precision;

    uint256 fork;

    constructor() {
        string memory root = vm.projectRoot();
        string memory metaPath =
            string.concat(root, "/../../node_modules/@synthetixio/v3-contracts/8453-andromeda/meta.json");
        string memory metaJson = vm.readFile(metaPath);

        coreProxyAddress = vm.parseJsonAddress(metaJson, ".contracts.CoreProxy");
        vm.label(coreProxyAddress, "CoreProxy");

        accountProxyAddress = vm.parseJsonAddress(metaJson, ".contracts.AccountProxy");
        vm.label(accountProxyAddress, "AccountProxy");

        spotMarketProxyAddress = vm.parseJsonAddress(metaJson, ".contracts.SpotMarketProxy");
        vm.label(spotMarketProxyAddress, "SpotMarketProxy");

        $USDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_USDC");
        vm.label($USDC, "$USDC");

        $sUSDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_sUSDC");
        vm.label($sUSDC, "$sUSDC");

        $stataUSDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_stataBasUSDC");
        vm.label($stataUSDC, "$stataUSDC");

        $sStataUSDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_sStataUSDC");
        vm.label($sStataUSDC, "$sStataUSDC");

        vm.label(AAVE_USDC_POOL, "AAVE_USDC_POOL");
    }

    function setUp() public {
        string memory forkUrl = vm.envString("RPC_BASE_MAINNET");
        fork = vm.createFork(forkUrl, 24976690);
        vm.selectFork(fork);
        // Verify fork
        assertEq(block.number, 24976690);
        assertEq(vm.activeFork(), fork);

        // Pyth bypass
        vm.etch(0x1234123412341234123412341234123412341234, "FORK");

        $USDC_Precision = 10 ** IERC20($USDC).decimals();
        $stataUSDC_Precision = 10 ** IERC20($stataUSDC).decimals();
        $sStataUSDC_Precision = 10 ** IERC20($sStataUSDC).decimals();
    }

    function test_increasePosition() public {
        uint128 ACCOUNT_ID = 522433293696;
        address ALICE = IAccountTokenModule(accountProxyAddress).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(AAVE_USDC_POOL);
        IERC20($USDC).transfer(ALICE, 100_000 * $USDC_Precision);

        // -780517508859281029
        int256 currentDebt = IVaultModule(coreProxyAddress).getPositionDebt(ACCOUNT_ID, poolId, $sStataUSDC);
        uint256 currentPosition = IVaultModule(coreProxyAddress).getPositionCollateral(ACCOUNT_ID, poolId, $sStataUSDC);
        uint256 currentAvailable =
            ICollateralModule(coreProxyAddress).getAccountAvailableCollateral(ACCOUNT_ID, $sStataUSDC);

        assertTrue(currentDebt < 0);
        assertEq(110 * $sStataUSDC_Precision, currentPosition);
        assertEq(0, currentAvailable);

        PositionManager positionManager = new PositionManager(
            coreProxyAddress,
            accountProxyAddress,
            spotMarketProxyAddress,
            $USDC,
            $sUSDC,
            synthMarketId_sUSDC,
            $stataUSDC,
            $sStataUSDC,
            synthMarketId_sStataUSDC,
            poolId
        );
        vm.label(address(positionManager), "PositionManager");

        vm.prank(ALICE);
        IERC20($USDC).approve(address(positionManager), UINT256_MAX);

        // Not hardcoding the amount `827888191` based on test block `24976690` stata rate
        // to make test more flexible about starting block.
        // But rather preview deposit result to get the exact stata token amount
        uint256 expectedStataTokenAmount = IStaticAaveToken($stataUSDC).previewDeposit(
            //
            888 * $USDC_Precision
        );
        uint256 expectedStataSynthAmount = expectedStataTokenAmount * $sStataUSDC_Precision / $stataUSDC_Precision;

        vm.prank(ALICE);
        IAccountTokenModule(accountProxyAddress).approve(address(positionManager), ACCOUNT_ID);

        vm.prank(ALICE);
        positionManager.increasePosition(ACCOUNT_ID, 888 * $USDC_Precision);

        assertEq(ALICE, IAccountTokenModule(accountProxyAddress).ownerOf(ACCOUNT_ID));

        int256 newDebt = IVaultModule(coreProxyAddress).getPositionDebt(ACCOUNT_ID, poolId, $sStataUSDC);
        uint256 newPosition = IVaultModule(coreProxyAddress).getPositionCollateral(ACCOUNT_ID, poolId, $sStataUSDC);
        uint256 newAvailable =
            ICollateralModule(coreProxyAddress).getAccountAvailableCollateral(ACCOUNT_ID, $sStataUSDC);

        assertEq(currentDebt, newDebt);
        assertEq(expectedStataSynthAmount + currentPosition, newPosition);
        assertEq(0, newAvailable);
    }
}
