pragma solidity ^0.8.21;

import {PythERC7412Wrapper} from "@synthetixio/pyth-erc7412-wrapper/contracts/PythERC7412Wrapper.sol";
import {IUSDTokenModule} from "@synthetixio/main/contracts/interfaces/IUSDTokenModule.sol";
import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountModule} from "@synthetixio/main/contracts/interfaces/IAccountModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {ICollateralConfigurationModule} from "@synthetixio/main/contracts/interfaces/ICollateralConfigurationModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {PositionManager} from "src/PositionManager.sol";
import {Test} from "forge-std/src/Test.sol";
import {Vm} from "forge-std/src/Vm.sol";
import {console} from "forge-std/src/console.sol";

contract PositionManager_increasePosition_Test is Test {
    address private USDProxy;
    address private CoreProxy;
    address private AccountProxy;
    address private CollateralToken_WETH;

    address private constant WETH_WHALE = 0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8;
    bytes32 private constant PYTH_FEED_ETH = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    uint256 fork;

    constructor() {
        string memory root = vm.projectRoot();
        string memory metaPath =
            string.concat(root, "/../../node_modules/@synthetixio/v3-contracts/42161-main/meta.json");
        string memory metaJson = vm.readFile(metaPath);

        USDProxy = vm.parseJsonAddress(metaJson, ".contracts.USDProxy");
        vm.label(USDProxy, "USDProxy");

        AccountProxy = vm.parseJsonAddress(metaJson, ".contracts.AccountProxy");
        vm.label(AccountProxy, "AccountProxy");

        CoreProxy = vm.parseJsonAddress(metaJson, ".contracts.CoreProxy");
        vm.label(CoreProxy, "CoreProxy");

        CollateralToken_WETH = vm.parseJsonAddress(metaJson, ".contracts.CollateralToken_WETH");
        vm.label(CollateralToken_WETH, "$WETH");
    }

    function setUp() public {
        string memory forkUrl = string.concat("https://arbitrum-mainnet.infura.io/v3/", vm.envString("INFURA_KEY"));
        fork = vm.createFork(forkUrl, 285545346);
        vm.selectFork(fork);

        // Verify fork
        assertEq(block.number, 21419019);
        assertEq(vm.activeFork(), fork);

        // Pyth bypass
        vm.etch(0x1234123412341234123412341234123412341234, "FORK");
    }

    function test_increasePosition() public {
        uint128 ACCOUNT_ID = 170141183460469231731687303715884106176;
        uint128 POOL_ID = 1;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        vm.prank(WETH_WHALE);
        IERC20(CollateralToken_WETH).approve(address(this), UINT256_MAX);

        vm.prank(WETH_WHALE);
        IERC20(CollateralToken_WETH).transfer(ALICE, 10 ether);

        // Current debt
        assertEq(
            18_388.423856608151437096 ether,
            IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, CollateralToken_WETH)
        );
        // Current liquidity position
        assertEq(50 ether, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, CollateralToken_WETH));
        // Current available collateral
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, CollateralToken_WETH));

        PositionManager positionManager = new PositionManager();
        vm.label(address(positionManager), "PositionManager");

        vm.prank(ALICE);
        IERC20(CollateralToken_WETH).approve(address(positionManager), UINT256_MAX);

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);

        vm.recordLogs();
        vm.prank(ALICE);
        positionManager.increasePosition(CoreProxy, AccountProxy, ACCOUNT_ID, POOL_ID, CollateralToken_WETH, 5 ether);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        assertEq(11, logs.length);
        // TODO: expect these logs
        /*
        │   ├─ emit Approval(owner: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], approved: 0x0000000000000000000000000000000000000000, tokenId: 170141183460469231731687303715884106176 [1.701e38])
        │   ├─ emit Transfer(from: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], to: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], tokenId: 170141183460469231731687303715884106176 [1.701e38])
        ├─ emit Transfer(from: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], to: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], value: 5000000000000000000 [5e18])
        ├─ emit Approval(owner: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], spender: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], value: 115792089237316195423570985008687907853269984665640564039452584007913129639935 [1.157e77])
        ├─ emit Approval(owner: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], spender: CoreProxy: [0xffffffaEff0B96Ea8e4f94b2253f31abdD875847], value: 5000000000000000000 [5e18])
        │   │   │   ├─ emit Transfer(from: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], to: CoreProxy: [0xffffffaEff0B96Ea8e4f94b2253f31abdD875847], value: 5000000000000000000 [5e18])
        │   │   │   ├─ emit Approval(owner: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], spender: CoreProxy: [0xffffffaEff0B96Ea8e4f94b2253f31abdD875847], value: 0)
        │   ├─ emit Deposited(accountId: 170141183460469231731687303715884106176 [1.701e38], collateralType: $WETH: [0x82aF49447D8a07e3bd95BD0d56f35241523fBab1], tokenAmount: 5000000000000000000 [5e18], sender: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f])
        │   ├─ emit DelegationUpdated(accountId: 170141183460469231731687303715884106176 [1.701e38], poolId: 1, collateralType: $WETH: [0x82aF49447D8a07e3bd95BD0d56f35241523fBab1], amount: 55000000000000000000 [5.5e19], leverage: 1000000000000000000 [1e18], sender: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f])
        │   ├─ emit Approval(owner: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], approved: 0x0000000000000000000000000000000000000000, tokenId: 170141183460469231731687303715884106176 [1.701e38])
        │   ├─ emit Transfer(from: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], to: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], tokenId: 170141183460469231731687303715884106176 [1.701e38])
        */
        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));
        // Current debt
        assertEq(
            18_388.423856608151437096 ether,
            IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, CollateralToken_WETH)
        );
        // Current liquidity position
        assertEq(55 ether, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, CollateralToken_WETH));
        // Current available collateral
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, CollateralToken_WETH));
    }
}
