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

contract PositionManager_setupPosition_Test is Test {
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
    }

    function test_setupPosition() public {
        uint128 ACCOUNT_ID = 0;
        uint128 POOL_ID = 1;
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        uint256 $USDC_Precision = 10 ** IERC20($USDC).decimals();
        uint256 $stataUSDC_Precision = 10 ** IERC20($stataUSDC).decimals();
        uint256 $sStataUSDC_Precision = 10 ** IERC20($sStataUSDC).decimals();

        vm.prank(AAVE_USDC_POOL);
        IERC20($USDC).transfer(ALICE, 100_000 * $USDC_Precision);

        assertEq(0, IVaultModule(coreProxyAddress).getPositionDebt(ACCOUNT_ID, POOL_ID, $sStataUSDC));
        assertEq(0, IVaultModule(coreProxyAddress).getPositionCollateral(ACCOUNT_ID, POOL_ID, $sStataUSDC));
        assertEq(0, ICollateralModule(coreProxyAddress).getAccountAvailableCollateral(ACCOUNT_ID, $sStataUSDC));

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
        positionManager.setupPosition(888 * $USDC_Precision);

        // Retrieve ACCOUNT_ID via enumeration (index 0, since ALICE owns only one token).
        ACCOUNT_ID = uint128(IAccountTokenModule(accountProxyAddress).tokenOfOwnerByIndex(ALICE, 0));

        assertEq(ALICE, IAccountTokenModule(accountProxyAddress).ownerOf(ACCOUNT_ID));

        assertEq(0, IVaultModule(coreProxyAddress).getPositionDebt(ACCOUNT_ID, POOL_ID, $sStataUSDC));
        assertEq(
            expectedStataSynthAmount,
            IVaultModule(coreProxyAddress).getPositionCollateral(ACCOUNT_ID, POOL_ID, $sStataUSDC)
        );
        assertEq(0, ICollateralModule(coreProxyAddress).getAccountAvailableCollateral(ACCOUNT_ID, $sStataUSDC));
    }
}
