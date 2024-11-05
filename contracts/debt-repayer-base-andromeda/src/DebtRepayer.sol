// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ISynthetixCore} from "./lib/ISynthetixCore.sol";
import {ISpotMarket} from "./lib/ISpotMarket.sol";
import {IUSDToken} from "./lib/IUSDToken.sol";
import {IERC20} from "./lib/IERC20.sol";
import {ERC2771Context} from "./lib/ERC2771Context.sol";
import {IAccountProxy} from "./lib/IAccountProxy.sol";

/**
 * Front end helper contract which repays debt through collateral in your account or wallet
 */
contract DebtRepayer {
    function depositDebtToRepay(
        address coreProxyAddress,
        address spotMarketAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint128 spotMarketId
    ) public {
        address msgSender = ERC2771Context._msgSender();
        IAccountProxy accountProxy = IAccountProxy(accountProxyAddress);
        accountProxy.transferFrom(msgSender, address(this), uint256(accountId));

        ISynthetixCore coreProxy = ISynthetixCore(coreProxyAddress);
        int256 debt = coreProxy.getPositionDebt(accountId, poolId, collateralType);

        if (debt > 0) {
            uint256 depositedAmount = coreProxy.getAccountAvailableCollateral(accountId, coreProxy.getUsdToken());

            if (uint256(debt) > depositedAmount) {
                uint256 remainingDebt = uint256(debt) - depositedAmount;

                ISpotMarket spotMarket = ISpotMarket(spotMarketAddress);
                (uint256 neededSynth,) = spotMarket.quoteSellExactOut(spotMarketId, remainingDebt, 0);
                (address toWrapToken,) = spotMarket.getWrapper(spotMarketId);
                uint256 toWrapTokenAmount = neededSynth * (10 ** IERC20(toWrapToken).decimals()) / (10 ** 18) + 1; // Assumption: All synths are 18 decimals

                IERC20(toWrapToken).transferFrom(msgSender, address(this), uint256(toWrapTokenAmount));
                IERC20(toWrapToken).approve(address(spotMarket), toWrapTokenAmount);
                spotMarket.wrap(spotMarketId, toWrapTokenAmount, neededSynth);
                spotMarket.sellExactOut(spotMarketId, remainingDebt, neededSynth, address(0));

                IUSDToken(coreProxy.getUsdToken()).approve(address(coreProxy), remainingDebt);
                coreProxy.deposit(accountId, coreProxy.getUsdToken(), remainingDebt);
            }

            coreProxy.burnUsd(accountId, poolId, collateralType, uint256(debt));
        } else if (debt < 0) {
            coreProxy.mintUsd(accountId, poolId, collateralType, uint256(-debt));
        }

        accountProxy.transferFrom(address(this), msgSender, uint256(accountId));
    }
}
