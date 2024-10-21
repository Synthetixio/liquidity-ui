// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ISynthetixCore} from "./lib/ISynthetixCore.sol";
import {IUSDToken} from "./lib/IUSDToken.sol";
import {ERC2771Context} from "./lib/ERC2771Context.sol";

/**
 * Tiny contract which deposits the needed amount of collateral into synthetix v3 account for debt repayment
 */
contract ClosePosition {
    error NotEnoughBalance(address tokenAddress, uint256 requiredAmount, uint256 availableAmount);

    function closePosition(
        address coreProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType
    ) public {
        address msgSender = ERC2771Context._msgSender();
        ISynthetixCore coreProxy = ISynthetixCore(coreProxyAddress);
        int256 debt = coreProxy.getPositionDebt(accountId, poolId, collateralType);
        if (debt > 0) {
            uint256 debtAmount = uint256(debt);

            IUSDToken usdToken = IUSDToken(coreProxy.getUsdToken());
            uint256 depositedAmount = coreProxy.getAccountAvailableCollateral(accountId, address(usdToken));
            if (debtAmount > depositedAmount) {
                // Need to deposit more tokens
                uint256 requiredAmount = debtAmount - depositedAmount;
                uint256 availableAmount = usdToken.balanceOf(msgSender);
                if (requiredAmount > availableAmount) {
                    revert NotEnoughBalance(address(usdToken), requiredAmount, availableAmount);
                }
                usdToken.approve(address(coreProxy), requiredAmount);
                coreProxy.deposit(accountId, address(usdToken), requiredAmount);
            }
            // Now we have more or exact amount of usd tokens deposited to repay the debt
            coreProxy.burnUsd(accountId, poolId, collateralType, debtAmount);
        } else if (debt < 0) {
            // claim negative debt
            coreProxy.mintUsd(accountId, poolId, collateralType, uint256(-debt));
        }

        // Set delegated collateral amount to 0, effectively closing position
        coreProxy.delegateCollateral(
            accountId,
            poolId,
            collateralType,
            0,
            1
        );
    }
}
