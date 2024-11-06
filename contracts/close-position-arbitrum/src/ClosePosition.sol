// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ISynthetixCore} from "./lib/ISynthetixCore.sol";
import {IUSDToken} from "./lib/IUSDToken.sol";
import {ERC2771Context} from "./lib/ERC2771Context.sol";
import {IAccountProxy} from "./lib/IAccountProxy.sol";

contract ClosePosition {
    error NotEnoughAllowance(
        address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance
    );
    error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount);

    function closePosition(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType
    ) public {
        address msgSender = ERC2771Context._msgSender();
        ISynthetixCore coreProxy = ISynthetixCore(coreProxyAddress);
        IAccountProxy accountProxy = IAccountProxy(accountProxyAddress);

        // Transfer account from wallet to contract
        accountProxy.transferFrom(msgSender, address(this), uint256(accountId));

        // Get current debt for position
        int256 debt = coreProxy.getPositionDebt(accountId, poolId, collateralType);
        if (debt > 0) {
            uint256 debtAmount = uint256(debt);

            IUSDToken usdToken = IUSDToken(coreProxy.getUsdToken());
            // Get deposited amount of USD Tokens available for repayment
            uint256 depositedAmount = coreProxy.getAccountAvailableCollateral(accountId, address(usdToken));
            if (debtAmount > depositedAmount) {
                // Need to deposit more USD tokens
                uint256 requiredAmount = debtAmount - depositedAmount;
                uint256 availableAllowance = usdToken.allowance(msgSender, address(this));
                if (requiredAmount > availableAllowance) {
                    // Wallet does not have enough USD tokens to repay debt
                    revert NotEnoughAllowance(msgSender, address(usdToken), requiredAmount, availableAllowance);
                }
                uint256 availableAmount = usdToken.balanceOf(msgSender);
                if (requiredAmount > availableAmount) {
                    // Wallet does not have enough USD tokens to repay debt
                    revert NotEnoughBalance(msgSender, address(usdToken), requiredAmount, availableAmount);
                }
                usdToken.transferFrom(msgSender, address(this), requiredAmount);
                usdToken.approve(address(coreProxy), requiredAmount);
                coreProxy.deposit(accountId, address(usdToken), requiredAmount);
            }
            // Now we have more or exact amount of USD tokens deposited to repay the debt
            coreProxy.burnUsd(accountId, poolId, collateralType, debtAmount);
        } else if (debt < 0) {
            // Claim negative debt
            coreProxy.mintUsd(accountId, poolId, collateralType, uint256(-debt));
        }

        // Set delegated collateral amount to 0, effectively closing position
        coreProxy.delegateCollateral(accountId, poolId, collateralType, 0, 1e18);

        // Transfer account back from contract to the wallet
        accountProxy.transferFrom(address(this), msgSender, uint256(accountId));
    }
}
