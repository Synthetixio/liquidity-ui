// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC2771Context} from "src/lib/ERC2771Context.sol";
import {IAccountProxy} from "src/lib/IAccountProxy.sol";
import {ISynthetixCore} from "src/lib/ISynthetixCore.sol";
import {IUSDToken} from "src/lib/IUSDToken.sol";

contract PositionManager {
    error NotEnoughAllowance(
        address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance
    );
    error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount);

    function _repay(
        ISynthetixCore coreProxy,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint256 debtAmount
    ) internal {
        address msgSender = ERC2771Context._msgSender();

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
    }

    function _clearDebt(ISynthetixCore coreProxy, uint128 accountId, uint128 poolId, address collateralType) internal {
        address msgSender = ERC2771Context._msgSender();

        // Get current debt for position
        int256 debt = coreProxy.getPositionDebt(accountId, poolId, collateralType);
        if (debt > 0) {
            uint256 debtAmount = uint256(debt);
            _repay(coreProxy, accountId, poolId, collateralType, debtAmount);
        } else if (debt < 0) {
            // Claim negative debt
            coreProxy.mintUsd(accountId, poolId, collateralType, uint256(-debt));
        }
    }

    function clearDebt(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType
    ) public {
        IAccountProxy accountProxy = IAccountProxy(accountProxyAddress);
        address msgSender = ERC2771Context._msgSender();
        accountProxy.transferFrom(msgSender, address(this), uint256(accountId));

        ISynthetixCore coreProxy = ISynthetixCore(coreProxyAddress);
        _clearDebt(coreProxy, accountId, poolId, collateralType);

        accountProxy.transferFrom(address(this), msgSender, uint256(accountId));
    }

    function repay(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint256 debtAmount
    ) public {
        IAccountProxy accountProxy = IAccountProxy(accountProxyAddress);
        address msgSender = ERC2771Context._msgSender();
        accountProxy.transferFrom(msgSender, address(this), uint256(accountId));

        ISynthetixCore coreProxy = ISynthetixCore(coreProxyAddress);
        _repay(coreProxy, accountId, poolId, collateralType, debtAmount);

        accountProxy.transferFrom(address(this), msgSender, uint256(accountId));
    }

    function delegate(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint256 delegatedAmount
    ) public {
        IAccountProxy accountProxy = IAccountProxy(accountProxyAddress);
        address msgSender = ERC2771Context._msgSender();
        accountProxy.transferFrom(msgSender, address(this), uint256(accountId));

        ISynthetixCore coreProxy = ISynthetixCore(coreProxyAddress);
        _clearDebt(coreProxy, accountId, poolId, collateralType);

        coreProxy.delegateCollateral(accountId, poolId, collateralType, delegatedAmount, 1e18);

        accountProxy.transferFrom(address(this), msgSender, uint256(accountId));
    }

    function closePosition(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType
    ) public {
        // Set delegated collateral amount to 0, effectively closing position
        delegate(coreProxyAddress, accountProxyAddress, accountId, poolId, collateralType, 0);
    }
}
