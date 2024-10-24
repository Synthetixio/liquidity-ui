// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ISynthetixCore} from "./lib/ISynthetixCore.sol";
import {ISpotMarket} from "./lib/ISpotMarket.sol";
import {IUSDToken} from "./lib/IUSDToken.sol";
import {ERC2771Context} from "./lib/ERC2771Context.sol";

/**
 * Tiny contract which deposits the needed amount of collateral into synthetix v3 account for debt repayment
 */
contract DebtRepayer {
    function depositDebtToRepay(
        address coreProxyAddress,
        address spotMarketAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint128 spotMarketId
    ) public {
        address msgSender = ERC2771Context._msgSender();
        ISynthetixCore coreProxy = ISynthetixCore(coreProxyAddress);
        int256 debt = coreProxy.getPositionDebt(accountId, poolId, collateralType);
        if (debt > 0) {
            ISpotMarket spotMarket = ISpotMarket(spotMarketAddress);
            (uint256 neededSynth,) = spotMarket.quoteSellExactOut(spotMarketId, uint256(debt), 0);
            (address toWrapToken,) = spotMarket.getWrapper(spotMarketId);
            uint256 toWrapTokenDecimals = IUSDToken(toWrapToken).decimals();
            uint256 toWrapTokenAmount = neededSynth * (10 ** toWrapTokenDecimals) / (10 ** 18) + 1;
            IUSDToken(toWrapToken).transferFrom(msgSender, address(this), uint256(toWrapTokenAmount));
            IUSDToken(toWrapToken).approve(address(spotMarket), toWrapTokenAmount);
            spotMarket.wrap(spotMarketId, toWrapTokenAmount, neededSynth);
            spotMarket.sellExactOut(spotMarketId, uint256(debt), neededSynth, address(0));
            IUSDToken(coreProxy.getUsdToken()).approve(address(coreProxy), uint256(debt));
            coreProxy.deposit(accountId, coreProxy.getUsdToken(), uint256(debt));
        }
    }
}
