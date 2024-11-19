// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ISynthetixCore} from './lib/ISynthetixCore.sol';
import {ISpotMarket} from './lib/ISpotMarket.sol';
import {IUSDToken} from './lib/IUSDToken.sol';
import {ERC2771Context} from './lib/ERC2771Context.sol';
import {IAccountProxy} from './lib/IAccountProxy.sol';

/**
 * Tiny contract which deposits the needed amount of collateral into synthetix v3 account for debt repayment
 */
contract DebtManager {
    error NotEnoughAllowance(
        address walletAddress,
        address tokenAddress,
        uint256 requiredAllowance,
        uint256 availableAllowance
    );
    error NotEnoughBalance(
        address walletAddress,
        address tokenAddress,
        uint256 requiredAmount,
        uint256 availableAmount
    );

    function settleDebt(
        address coreProxyAddress,
        address accountProxyAddress,
        address spotMarketAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint128 spotMarketId
    ) public {
        address msgSender = ERC2771Context._msgSender();
        ISynthetixCore coreProxy = ISynthetixCore(coreProxyAddress);
        IAccountProxy accountProxy = IAccountProxy(accountProxyAddress);

        // Transfer account from wallet to contract
        accountProxy.transferFrom(msgSender, address(this), uint256(accountId));

        int256 debt = coreProxy.getPositionDebt(accountId, poolId, collateralType);
        if (debt > 0) {
            uint256 debtAmount = uint256(debt);

            IUSDToken usdToken = IUSDToken(coreProxy.getUsdToken());
            // Get deposited amount of USD Tokens available for repayment
            uint256 depositedAmount = coreProxy.getAccountAvailableCollateral(
                accountId,
                address(usdToken)
            );
            if (debtAmount > depositedAmount) {
                uint256 requiredUSDAmount = debtAmount - depositedAmount;

                ISpotMarket spotMarket = ISpotMarket(spotMarketAddress);
                (uint256 neededSynth, ) = spotMarket.quoteSellExactOut(
                    spotMarketId,
                    requiredUSDAmount,
                    0
                );
                (address toWrapToken, ) = spotMarket.getWrapper(spotMarketId);
                uint256 toWrapTokenDecimals = IUSDToken(toWrapToken).decimals();
                uint256 toWrapTokenAmount = (neededSynth * (10 ** toWrapTokenDecimals)) /
                    (10 ** 18) +
                    1;

                uint256 availableAllowance = IUSDToken(toWrapToken).allowance(
                    msgSender,
                    address(this)
                );
                if (toWrapTokenAmount > availableAllowance) {
                    // Wallet does not have enough USD tokens to repay debt
                    revert NotEnoughAllowance(
                        msgSender,
                        toWrapToken,
                        toWrapTokenAmount,
                        availableAllowance
                    );
                }
                uint256 availableAmount = IUSDToken(toWrapToken).balanceOf(msgSender);
                if (toWrapTokenAmount > availableAmount) {
                    // Wallet does not have enough USD tokens to repay debt
                    revert NotEnoughBalance(
                        msgSender,
                        toWrapToken,
                        toWrapTokenAmount,
                        availableAmount
                    );
                }

                IUSDToken(toWrapToken).transferFrom(
                    msgSender,
                    address(this),
                    uint256(toWrapTokenAmount)
                );
                IUSDToken(toWrapToken).approve(address(spotMarket), toWrapTokenAmount);
                spotMarket.wrap(spotMarketId, toWrapTokenAmount, neededSynth);
                spotMarket.sellExactOut(spotMarketId, requiredUSDAmount, neededSynth, address(0));
                IUSDToken(coreProxy.getUsdToken()).approve(address(coreProxy), requiredUSDAmount);
                coreProxy.deposit(accountId, coreProxy.getUsdToken(), requiredUSDAmount);
            }

            coreProxy.burnUsd(accountId, poolId, collateralType, debtAmount);
        } else if (debt < 0) {
            coreProxy.mintUsd(accountId, poolId, collateralType, uint256(-debt));
        }

        // Transfer account back from contract to the wallet
        accountProxy.transferFrom(address(this), msgSender, uint256(accountId));
    }
}
