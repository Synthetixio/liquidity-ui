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

contract PositionManager_clearDebt_Test is Test {
    address private USDProxy;
    address private CoreProxy;
    address private AccountProxy;
    address private CollateralToken_WETH;

    address private constant WETH_WHALE = 0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8;
    address private constant USDx_WHALE = 0x096A8865367686290639bc50bF8D85C0110d9Fea; // USDe/USDx Wrapper
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

    function test_clearDebt() public {
        uint128 ACCOUNT_ID = 170141183460469231731687303715884106176;
        uint128 POOL_ID = 1;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        assertEq(
            18_388.423856608151437096 ether,
            IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, CollateralToken_WETH)
        );
        assertEq(50 ether, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, CollateralToken_WETH));
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, CollateralToken_WETH));

        PositionManager positionManager = new PositionManager();
        vm.label(address(positionManager), "PositionManager");

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);
        vm.prank(ALICE);
        IERC20(USDProxy).approve(address(positionManager), UINT256_MAX);

        vm.prank(USDx_WHALE);
        IERC20(USDProxy).approve(address(this), UINT256_MAX);
        vm.prank(USDx_WHALE);
        IERC20(USDProxy).transfer(ALICE, 20_000 ether); // need to cover >18k debt

        vm.recordLogs();
        vm.prank(ALICE);
        positionManager.clearDebt(CoreProxy, AccountProxy, ACCOUNT_ID, POOL_ID, CollateralToken_WETH);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        assertEq(10, logs.length);
        // TODO: expect some of these logs
        /*
        ├─ emit Approval(owner: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], approved: 0x0000000000000000000000000000000000000000, tokenId: 170141183460469231731687303715884106176 [1.701e38])
        ├─ emit Transfer(from: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], to: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], tokenId: 170141183460469231731687303715884106176 [1.701e38])
        ├─ emit Transfer(from: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], to: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], value: 18388423856608151437096 [1.838e22])
        ├─ emit Approval(owner: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], spender: CoreProxy: [0xffffffaEff0B96Ea8e4f94b2253f31abdD875847], value: 18388423856608151437096 [1.838e22])
        │   │   │   ├─ emit Transfer(from: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], to: CoreProxy: [0xffffffaEff0B96Ea8e4f94b2253f31abdD875847], value: 18388423856608151437096 [1.838e22])
        ├─ emit Deposited(accountId: 170141183460469231731687303715884106176 [1.701e38], collateralType: USDProxy: [0xb2F30A7C980f052f02563fb518dcc39e6bf38175], tokenAmount: 18388423856608151437096 [1.838e22], sender: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f])
        │   │   │   ├─ emit Transfer(from: CoreProxy: [0xffffffaEff0B96Ea8e4f94b2253f31abdD875847], to: 0x0000000000000000000000000000000000000000, value: 18388423856608151437096 [1.838e22])
        ├─ emit UsdBurned(accountId: 170141183460469231731687303715884106176 [1.701e38], poolId: 1, collateralType: $WETH: [0x82aF49447D8a07e3bd95BD0d56f35241523fBab1], amount: 18388423856608151437096 [1.838e22], sender: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f])
        ├─ emit Approval(owner: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], approved: 0x0000000000000000000000000000000000000000, tokenId: 170141183460469231731687303715884106176 [1.701e38])
        ├─ emit Transfer(from: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], to: 0xA11CE: [0x908D8D559A6FB979e3C3221039E5b8C3C5c2e91a], tokenId: 170141183460469231731687303715884106176 [1.701e38])
        */
        // Verify "event Deposited(uint128 indexed accountId, address indexed collateralType, uint256 tokenAmount, address indexed sender)"
        assertEq(logs[5].topics[0], keccak256("Deposited(uint128,address,uint256,address)"));
        assertEq(ACCOUNT_ID, uint128(uint256(logs[5].topics[1])));
        assertEq(USDProxy, address(uint160(uint256(logs[5].topics[2]))));

        // Verify "event UsdBurned(uint128 indexed accountId, uint128 indexed poolId, address collateralType, uint256 amount, address indexed sender)"
        assertEq(logs[7].topics[0], keccak256("UsdBurned(uint128,uint128,address,uint256,address)"));
        assertEq(ACCOUNT_ID, uint128(uint256(logs[7].topics[1])));

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        assertEq(0, IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, CollateralToken_WETH));
        assertEq(50 ether, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, CollateralToken_WETH));
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, CollateralToken_WETH));
    }

    function test_clearDebt_mintNegativeDebt() public {
        uint128 ACCOUNT_ID = 891074210923; // account with negative debt
        uint128 POOL_ID = 1;
        address ALICE = IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        assertEq(
            -21.961685926319907138 ether,
            IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, CollateralToken_WETH)
        );
        assertEq(0.19 ether, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, CollateralToken_WETH));
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, CollateralToken_WETH));

        PositionManager positionManager = new PositionManager();
        vm.label(address(positionManager), "PositionManager");

        vm.prank(ALICE);
        IAccountTokenModule(AccountProxy).approve(address(positionManager), ACCOUNT_ID);
        vm.prank(ALICE);
        IERC20(USDProxy).approve(address(positionManager), UINT256_MAX);

        vm.recordLogs();
        vm.prank(ALICE);
        positionManager.clearDebt(CoreProxy, AccountProxy, ACCOUNT_ID, POOL_ID, CollateralToken_WETH);
        Vm.Log[] memory logs = vm.getRecordedLogs();

        assertEq(6, logs.length);
        // TODO: expect some of these logs
        /*
        ├─ emit Approval(owner: 0xA11CE: [0xAb7Ab9b6495072c1136F96E301bD8f8DE900f119], approved: 0x0000000000000000000000000000000000000000, tokenId: 891074210923 [8.91e11])
        ├─ emit Transfer(from: 0xA11CE: [0xAb7Ab9b6495072c1136F96E301bD8f8DE900f119], to: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], tokenId: 891074210923 [8.91e11])
        │   │   │   ├─ emit Transfer(from: 0x0000000000000000000000000000000000000000, to: CoreProxy: [0xffffffaEff0B96Ea8e4f94b2253f31abdD875847], value: 21961685926319907138 [2.196e19])
        ├─ emit UsdMinted(accountId: 891074210923 [8.91e11], poolId: 1, collateralType: $WETH: [0x82aF49447D8a07e3bd95BD0d56f35241523fBab1], amount: 21961685926319907138 [2.196e19], sender: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f])
        ├─ emit Approval(owner: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], approved: 0x0000000000000000000000000000000000000000, tokenId: 891074210923 [8.91e11])
        ├─ emit Transfer(from: PositionManager: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f], to: 0xA11CE: [0xAb7Ab9b6495072c1136F96E301bD8f8DE900f119], tokenId: 891074210923 [8.91e11])
        */

        // Verify "event UsdMinted(uint128 indexed accountId, uint128 indexed poolId, address collateralType, uint256 amount, address indexed sender)"
        assertEq(logs[3].topics[0], keccak256("UsdMinted(uint128,uint128,address,uint256,address)"));
        assertEq(ACCOUNT_ID, uint128(uint256(logs[3].topics[1])));

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        assertEq(0, IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, CollateralToken_WETH));
        assertEq(0.19 ether, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, CollateralToken_WETH));
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, CollateralToken_WETH));
    }
}
