// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/src/Test.sol";

import {MintableToken} from "./MintableToken.sol";
import {DebtRepayer} from "src/DebtRepayer.sol";
import {ISynthetixCore} from "src/lib/ISynthetixCore.sol";
import {ISpotMarket} from "src/lib/ISpotMarket.sol";
import {IUSDToken} from "src/lib/IUSDToken.sol";
import {IAccountProxy} from "src/lib/IAccountProxy.sol";

contract DebtRepayerTest is Test {
    DebtRepayer public debtRepayer;
    MintableToken public USDC;

    address coreProxyAddress = 0x1111111111111111111111111111111111111111;
    address spotMarketAddress = 0x2222222222222222222222222222222222222222;
    address accountProxyAddress = 0x3333333333333333333333333333333333333333;
    address systemDebtToken = 0x4444444444444444444444444444444444444444;

    address user = vm.addr(0xA11CE);

    uint128 accountId = 1775123123;
    uint128 poolId = 1;
    uint128 spotMarketId = 24;

    bytes internal constant NoDebtToRepay = "NoDebtToRepay";

    function setUp() public {
        USDC = new MintableToken("USDC", 6);
        USDC.mint(user, 1000 * 10 ** USDC.decimals());

        debtRepayer = new DebtRepayer();

        vm.startPrank(user);
        USDC.approve(address(debtRepayer), 1000 * 10 ** USDC.decimals());
        vm.stopPrank();

        vm.mockCall(
            coreProxyAddress, abi.encodeWithSelector(ISynthetixCore.getUsdToken.selector), abi.encode(systemDebtToken)
        );
        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.getAccountAvailableCollateral.selector, accountId, systemDebtToken),
            abi.encode(0)
        );
        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.getPositionDebt.selector, accountId, poolId, address(USDC)),
            abi.encode(int256(1000 * 10 ** 18))
        );
        vm.mockCall(
            spotMarketAddress,
            abi.encodeWithSelector(ISpotMarket.getWrapper.selector, spotMarketId),
            abi.encode(address(USDC), uint256(0))
        );
        vm.mockCall(
            accountProxyAddress,
            abi.encodeWithSelector(IAccountProxy.transferFrom.selector, user, address(this), accountId),
            abi.encode()
        );
    }

    function test_depositDebtToRepay_whenNegativeDebt_success() public {
        vm.startPrank(user);

        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.getPositionDebt.selector, accountId, poolId, address(USDC)),
            abi.encode(int256(-1000 * 10 ** 18))
        );

        vm.expectCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.mintUsd.selector, accountId, poolId, address(USDC), 1000 * 10 ** 18)
        );

        debtRepayer.depositDebtToRepay(
            coreProxyAddress, spotMarketAddress, accountProxyAddress, accountId, poolId, address(USDC), spotMarketId
        );
    }

    function test_depositDebtToRepay_debtCoveredByCollateralOnAccount_success() public {
        vm.startPrank(user);

        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.getAccountAvailableCollateral.selector, accountId, systemDebtToken),
            abi.encode(1000 * 10 ** 18)
        );
        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(
                ISynthetixCore.burnUsd.selector, accountId, poolId, address(USDC), 1000 * 10 ** USDC.decimals()
            ),
            abi.encode()
        );

        vm.expectCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.burnUsd.selector, accountId, poolId, address(USDC), 1000 * 10 ** 18)
        );
        vm.expectCall(coreProxyAddress, abi.encodeWithSelector(ISynthetixCore.deposit.selector), 0);

        debtRepayer.depositDebtToRepay(
            coreProxyAddress, spotMarketAddress, accountProxyAddress, accountId, poolId, address(USDC), spotMarketId
        );
    }

    function test_depositDebtToRepay_debtRequiresWrappingUSDC_success() public {
        vm.startPrank(user);

        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.getAccountAvailableCollateral.selector, accountId, systemDebtToken),
            abi.encode(100 * 10 ** 18)
        );

        uint256 neededSynth = 900 * 10 ** 18;
        uint256 toWrapAmount = 900 * 10 ** USDC.decimals() + 1;

        vm.mockCall(
            spotMarketAddress,
            abi.encodeWithSelector(ISpotMarket.quoteSellExactOut.selector, spotMarketId, neededSynth, 0),
            abi.encode(neededSynth, 0, 0, 0, 0)
        );
        vm.mockCall(
            spotMarketAddress,
            abi.encodeWithSelector(ISpotMarket.wrap.selector, spotMarketId, toWrapAmount, neededSynth),
            abi.encode(0, 0, 0, 0, 0)
        );
        vm.mockCall(
            spotMarketAddress,
            abi.encodeWithSelector(
                ISpotMarket.sellExactOut.selector, spotMarketId, neededSynth, neededSynth, address(0)
            ),
            abi.encode(0, 0, 0, 0, 0)
        );
        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.deposit.selector, accountId, address(USDC), neededSynth),
            abi.encode()
        );
        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(
                ISynthetixCore.burnUsd.selector, accountId, poolId, address(USDC), 1000 * 10 ** USDC.decimals()
            ),
            abi.encode()
        );
        vm.mockCall(
            systemDebtToken,
            abi.encodeWithSelector(IUSDToken.approve.selector, coreProxyAddress, 900 * 10 ** 18),
            abi.encode(true)
        );

        vm.expectCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.burnUsd.selector, accountId, poolId, address(USDC), 1000 * 10 ** 18)
        );
        vm.expectCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.deposit.selector, accountId, systemDebtToken, 900 * 10 ** 18)
        );

        debtRepayer.depositDebtToRepay(
            coreProxyAddress, spotMarketAddress, accountProxyAddress, accountId, poolId, address(USDC), spotMarketId
        );
    }

    function test_depositDebtToRepay_extremeNumbersTestRounding_success() public {
        vm.startPrank(user);

        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.getAccountAvailableCollateral.selector, accountId, systemDebtToken),
            abi.encode(1)
        );

        uint256 neededSynth = 999999999999999999999;
        uint256 toWrapAmount = 1000000000; // Cutting decimals expect to round up otherwise sellExactOut fail

        vm.mockCall(
            spotMarketAddress,
            abi.encodeWithSelector(ISpotMarket.quoteSellExactOut.selector, spotMarketId, neededSynth, 0),
            abi.encode(neededSynth, 0, 0, 0, 0)
        );
        vm.mockCall(
            spotMarketAddress,
            abi.encodeWithSelector(ISpotMarket.wrap.selector, spotMarketId, toWrapAmount, neededSynth),
            abi.encode(0, 0, 0, 0, 0)
        );
        vm.mockCall(
            spotMarketAddress,
            abi.encodeWithSelector(
                ISpotMarket.sellExactOut.selector, spotMarketId, neededSynth, neededSynth, address(0)
            ),
            abi.encode(0, 0, 0, 0, 0)
        );
        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.deposit.selector, accountId, address(USDC), neededSynth),
            abi.encode()
        );
        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(
                ISynthetixCore.burnUsd.selector, accountId, poolId, address(USDC), 1000 * 10 ** USDC.decimals()
            ),
            abi.encode()
        );
        vm.mockCall(
            systemDebtToken,
            abi.encodeWithSelector(IUSDToken.approve.selector, coreProxyAddress, neededSynth),
            abi.encode(true)
        );

        vm.expectCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.burnUsd.selector, accountId, poolId, address(USDC), 1000 * 10 ** 18)
        );
        vm.expectCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.deposit.selector, accountId, systemDebtToken, 999999999999999999999)
        );

        debtRepayer.depositDebtToRepay(
            coreProxyAddress, spotMarketAddress, accountProxyAddress, accountId, poolId, address(USDC), spotMarketId
        );
    }

    function test_depositDebtToRepay_debtIsZero_doesNotRevertOrChangeDebt() public {
        vm.startPrank(user);

        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.getPositionDebt.selector, accountId, poolId, address(USDC)),
            abi.encode(int256(0))
        );

        vm.expectCall(coreProxyAddress, abi.encodeWithSelector(ISynthetixCore.mintUsd.selector), 0);
        vm.expectCall(coreProxyAddress, abi.encodeWithSelector(ISynthetixCore.burnUsd.selector), 0);

        debtRepayer.depositDebtToRepay(
            coreProxyAddress, spotMarketAddress, accountProxyAddress, accountId, poolId, address(USDC), spotMarketId
        );
    }

    function test_depositDebtToRepay_debtMoreThanUSDCAmount_reverts() public {
        vm.startPrank(user);

        vm.mockCall(
            coreProxyAddress,
            abi.encodeWithSelector(ISynthetixCore.getPositionDebt.selector, accountId, poolId, address(USDC)),
            abi.encode(int256(1100 * 10 ** 18))
        );

        uint256 neededSynth = 1100 * 10 ** 18;

        vm.mockCall(
            spotMarketAddress,
            abi.encodeWithSelector(ISpotMarket.quoteSellExactOut.selector, spotMarketId, neededSynth, 0),
            abi.encode(neededSynth, 0, 0, 0, 0)
        );

        vm.expectRevert("ERC20: subtraction underflow");

        debtRepayer.depositDebtToRepay(
            coreProxyAddress, spotMarketAddress, accountProxyAddress, accountId, poolId, address(USDC), spotMarketId
        );
    }
}
