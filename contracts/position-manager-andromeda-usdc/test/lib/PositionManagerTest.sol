pragma solidity ^0.8.21;

import {PythERC7412Wrapper} from "@synthetixio/pyth-erc7412-wrapper/contracts/PythERC7412Wrapper.sol";
import {IUSDTokenModule} from "@synthetixio/main/contracts/interfaces/IUSDTokenModule.sol";
import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountModule} from "@synthetixio/main/contracts/interfaces/IAccountModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {ICollateralConfigurationModule} from "@synthetixio/main/contracts/interfaces/ICollateralConfigurationModule.sol";
import {IMarketManagerModule} from "@synthetixio/main/contracts/interfaces/IMarketManagerModule.sol";
import {AccessError} from "@synthetixio/core-contracts/contracts/errors/AccessError.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManagerAndromedaUSDC} from "src/PositionManager.sol";
import {Test} from "forge-std/src/Test.sol";
import {Vm} from "forge-std/src/Vm.sol";
import {console} from "forge-std/src/console.sol";

contract PositionManagerTest is Test {
    address internal CoreProxy;
    address internal AccountProxy;
    address internal SpotMarketProxy;

    address internal $USDC;
    address internal $synthUSDC;
    address internal $snxUSD;

    uint128 internal synthIdUSDC = 1;
    uint128 internal synthIdSnxUSD = 0;

    uint128 internal poolId = 1;

    address internal constant AAVE_USDC_POOL = 0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB; // Aave: aBasUSDC Token

    uint256 internal $USDCPrecision;
    uint256 internal $synthUSDCPrecision;
    uint256 internal $snxUSDPrecision;

    uint256 internal fork;
    uint256 internal forkBlockNumber;

    PositionManagerAndromedaUSDC internal positionManager;

    constructor() {
        string memory root = vm.projectRoot();
        string memory metaPath =
            string.concat(root, "/../../node_modules/@synthetixio/v3-contracts/8453-andromeda/meta.json");
        string memory metaJson = vm.readFile(metaPath);

        CoreProxy = vm.parseJsonAddress(metaJson, ".contracts.CoreProxy");
        vm.label(CoreProxy, "CoreProxy");

        AccountProxy = vm.parseJsonAddress(metaJson, ".contracts.AccountProxy");
        vm.label(AccountProxy, "AccountProxy");

        SpotMarketProxy = vm.parseJsonAddress(metaJson, ".contracts.SpotMarketProxy");
        vm.label(SpotMarketProxy, "SpotMarketProxy");

        $USDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_USDC");
        vm.label($USDC, "$USDC");

        $synthUSDC = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_sUSDC");
        vm.label($synthUSDC, "$synthUSDC");

        vm.label(AAVE_USDC_POOL, "AAVE_USDC_POOL");
    }

    function setUp() public {
        string memory forkUrl = vm.envString("RPC_BASE_MAINNET");
        fork = vm.createFork(forkUrl, forkBlockNumber);
        vm.selectFork(fork);

        // Verify fork
        assertEq(block.number, forkBlockNumber);
        assertEq(vm.activeFork(), fork);

        // Pyth bypass
        vm.etch(0x1234123412341234123412341234123412341234, "FORK");

        $USDCPrecision = 10 ** IERC20($USDC).decimals();
        $synthUSDCPrecision = 10 ** IERC20($synthUSDC).decimals();

        positionManager = new PositionManagerAndromedaUSDC(
            CoreProxy, AccountProxy, SpotMarketProxy, $USDC, $synthUSDC, synthIdUSDC, poolId
        );
        vm.label(address(positionManager), "PositionManager");

        IERC20 usdToken = IMarketManagerModule(CoreProxy).getUsdToken();
        $snxUSD = address(usdToken);
        vm.label($snxUSD, "$snxUSD");
        $snxUSDPrecision = 10 ** usdToken.decimals();
    }
}
