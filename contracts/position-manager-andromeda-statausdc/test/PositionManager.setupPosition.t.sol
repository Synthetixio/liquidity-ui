pragma solidity ^0.8.21;

import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {IStaticAaveToken} from "src/PositionManager.sol";
import {PositionManagerTest} from "./lib/PositionManagerTest.sol";

contract PositionManager_setupPosition_Test is PositionManagerTest {
    constructor() {
        forkBlockNumber = 24976690;
    }

    function test_setupPosition() public {
        uint128 ACCOUNT_ID = 0;
        uint128 POOL_ID = 1;
        address ALICE = vm.addr(0xA11CE);
        vm.label(ALICE, "0xA11CE");
        vm.deal(ALICE, 1 ether);

        uint256 $USDC_Precision = 10 ** IERC20($USDC).decimals();
        uint256 $stataUSDC_Precision = 10 ** IERC20($stataUSDC).decimals();
        uint256 $synthStataUSDC_Precision = 10 ** IERC20($synthStataUSDC).decimals();

        vm.prank(AAVE_USDC_POOL);
        IERC20($USDC).transfer(ALICE, 100_000 * $USDC_Precision);

        assertEq(0, IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, $synthStataUSDC));
        assertEq(0, IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, $synthStataUSDC));
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthStataUSDC));

        vm.prank(ALICE);
        IERC20($USDC).approve(address(positionManager), UINT256_MAX);

        // Not hardcoding the amount `827888191` based on test block `24976690` stata rate
        // to make test more flexible about starting block.
        // But rather preview deposit result to get the exact stata token amount
        uint256 expectedStataTokenAmount = IStaticAaveToken($stataUSDC).previewDeposit(
            //
            888 * $USDC_Precision
        );
        uint256 expectedStataSynthAmount = expectedStataTokenAmount * $synthStataUSDC_Precision / $stataUSDC_Precision;

        vm.prank(ALICE);
        positionManager.setupPosition(888 * $USDC_Precision);

        // Retrieve ACCOUNT_ID via enumeration (index 0, since ALICE owns only one token).
        ACCOUNT_ID = uint128(IAccountTokenModule(AccountProxy).tokenOfOwnerByIndex(ALICE, 0));

        assertEq(ALICE, IAccountTokenModule(AccountProxy).ownerOf(ACCOUNT_ID));

        assertEq(0, IVaultModule(CoreProxy).getPositionDebt(ACCOUNT_ID, POOL_ID, $synthStataUSDC));
        assertEq(
            expectedStataSynthAmount,
            IVaultModule(CoreProxy).getPositionCollateral(ACCOUNT_ID, POOL_ID, $synthStataUSDC)
        );
        assertEq(0, ICollateralModule(CoreProxy).getAccountAvailableCollateral(ACCOUNT_ID, $synthStataUSDC));
    }
}
