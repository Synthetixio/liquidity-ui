// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC2771Context} from "@synthetixio/core-contracts/contracts/utils/ERC2771Context.sol";
import {IMarketManagerModule} from "@synthetixio/main/contracts/interfaces/IMarketManagerModule.sol";
import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IIssueUSDModule} from "@synthetixio/main/contracts/interfaces/IIssueUSDModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountModule} from "@synthetixio/main/contracts/interfaces/IAccountModule.sol";
import {IAccountTokenModule} from "@synthetixio/main/contracts/interfaces/IAccountTokenModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {IERC721Receiver} from "@synthetixio/core-contracts/contracts/interfaces/IERC721Receiver.sol";

contract PositionManager {
    error NotEnoughAllowance(
        address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance
    );
    error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount);

    /**
     * @notice Creates new account, deposits collateral to the system and then delegates it to the pool
     * @param coreProxyAddress CoreProxy contract address
     * @param accountProxyAddress AccountProxy contract address
     * @param accountId Account ID to be created. If not specified, auto-generated ID will be used
     * @param poolId poolId Pool ID
     * @param collateralType Collateral token address to be delegated
     * @param amount The amount of collateral to delegate. This is a relative number
     */
    function setupPosition(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint256 amount
    ) public {
        address msgSender = ERC2771Context._msgSender();
        if (accountId == 0) {
            // Create a new account with auto-generated ID
            accountId = IAccountModule(coreProxyAddress).createAccount();
        } else {
            // Create new account with requested ID
            IAccountModule(coreProxyAddress).createAccount(accountId);
        }
        _ensureDeposit(coreProxyAddress, accountId, collateralType, amount);
        uint256 currentDelegatedAmount =
            IVaultModule(coreProxyAddress).getPositionCollateral(accountId, poolId, collateralType);
        IVaultModule(coreProxyAddress).delegateCollateral(
            accountId, poolId, collateralType, currentDelegatedAmount + amount, 1e18
        );
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(address(this), msgSender, uint256(accountId));
    }

    /**
     * @notice Deposits extra collateral to the system if needed and then delegates requested amount to the pool
     * @param coreProxyAddress CoreProxy contract address
     * @param accountProxyAddress AccountProxy contract address
     * @param accountId Account ID
     * @param poolId poolId Pool ID
     * @param collateralType Collateral token address to be delegated
     * @param amount The amount of collateral to delegate. This is a relative number
     */
    function increasePosition(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint256 amount
    ) public {
        address msgSender = ERC2771Context._msgSender();
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(msgSender, address(this), uint256(accountId));
        _ensureDeposit(coreProxyAddress, accountId, collateralType, amount);
        uint256 currentDelegatedAmount =
            IVaultModule(coreProxyAddress).getPositionCollateral(accountId, poolId, collateralType);
        IVaultModule(coreProxyAddress).delegateCollateral(
            accountId, poolId, collateralType, currentDelegatedAmount + amount, 1e18
        );
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(address(this), msgSender, uint256(accountId));
    }

    /**
     * @notice Removes requested amount of liquidity from the pool, requires debt repayment
     * @param coreProxyAddress CoreProxy contract address
     * @param accountProxyAddress AccountProxy contract address
     * @param accountId Account ID
     * @param poolId poolId Pool ID
     * @param collateralType Collateral token address to be delegated
     * @param amount The amount of collateral to undelegate. This is a relative number
     */
    function decreasePosition(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint256 amount
    ) public {
        address msgSender = ERC2771Context._msgSender();
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(msgSender, address(this), uint256(accountId));
        _clearDebt(coreProxyAddress, accountId, poolId, collateralType);
        uint256 currentDelegatedAmount =
            IVaultModule(coreProxyAddress).getPositionCollateral(accountId, poolId, collateralType);
        IVaultModule(coreProxyAddress).delegateCollateral(
            accountId, poolId, collateralType, currentDelegatedAmount - amount, 1e18
        );
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(address(this), msgSender, uint256(accountId));
    }

    /**
     * @notice Removes all provided liquidity from the pool, requires full debt repayment
     * @param coreProxyAddress CoreProxy contract address
     * @param accountProxyAddress AccountProxy contract address
     * @param accountId Account ID
     * @param poolId poolId Pool ID
     * @param collateralType Collateral token address
     */
    function closePosition(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType
    ) public {
        address msgSender = ERC2771Context._msgSender();
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(msgSender, address(this), uint256(accountId));
        _clearDebt(coreProxyAddress, accountId, poolId, collateralType);
        IVaultModule(coreProxyAddress).delegateCollateral(accountId, poolId, collateralType, 0, 1e18);
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(address(this), msgSender, uint256(accountId));
    }

    /**
     * @notice Repays specified amount of debt, depositing any additional necessary amount of system stables to the system
     * @param coreProxyAddress CoreProxy contract address
     * @param accountProxyAddress AccountProxy contract address
     * @param accountId Account ID
     * @param collateralType Collateral token address
     * @param debtAmount Amount of debt to repay
     */
    function repay(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint256 debtAmount
    ) public {
        address msgSender = ERC2771Context._msgSender();
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(msgSender, address(this), uint256(accountId));
        _repay(coreProxyAddress, accountId, poolId, collateralType, debtAmount);
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(address(this), msgSender, uint256(accountId));
    }

    /**
     * @notice Clears the debt to 0, repays positive debt or mints extra system stable in case of negative debt
     * @param coreProxyAddress CoreProxy contract address
     * @param accountProxyAddress AccountProxy contract address
     * @param accountId Account ID
     * @param collateralType Collateral token address
     */
    function clearDebt(
        address coreProxyAddress,
        address accountProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType
    ) public {
        address msgSender = ERC2771Context._msgSender();
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(msgSender, address(this), uint256(accountId));
        _clearDebt(coreProxyAddress, accountId, poolId, collateralType);
        IAccountTokenModule(accountProxyAddress).safeTransferFrom(address(this), msgSender, uint256(accountId));
    }

    /**
     * @notice Transfers specified amount of tokens to the contract
     * @param tokenAddress Token address
     * @param tokenAmount Token amount
     */
    function _transfer(address tokenAddress, uint256 tokenAmount) internal {
        address msgSender = ERC2771Context._msgSender();
        IERC20 token = IERC20(tokenAddress);

        uint256 availableAllowance = token.allowance(msgSender, address(this));
        if (tokenAmount > availableAllowance) {
            // Wallet does not have enough USD tokens to repay debt
            revert NotEnoughAllowance(msgSender, tokenAddress, tokenAmount, availableAllowance);
        }
        uint256 availableAmount = token.balanceOf(msgSender);
        if (tokenAmount > availableAmount) {
            // Wallet does not have enough USD tokens to repay debt
            revert NotEnoughBalance(msgSender, tokenAddress, tokenAmount, availableAmount);
        }
        token.transferFrom(msgSender, address(this), tokenAmount);
    }

    /**
     * @notice Ensures account has exact amount of token deposited to the system
     * @param coreProxyAddress CoreProxy contract address
     * @param accountId Account ID
     * @param collateralType Collateral token address
     * @param expectedAmount Exact amount of tokens that expected to be deposited to the system. NOTE: this is absolute value
     */
    function _ensureDeposit(address coreProxyAddress, uint128 accountId, address collateralType, uint256 expectedAmount)
        internal
    {
        uint256 depositedAmount =
            ICollateralModule(coreProxyAddress).getAccountAvailableCollateral(accountId, collateralType);
        if (expectedAmount > depositedAmount) {
            uint256 requiredAmount = expectedAmount - depositedAmount;
            _transfer(collateralType, requiredAmount);
            IERC20(collateralType).approve(coreProxyAddress, requiredAmount);
            ICollateralModule(coreProxyAddress).deposit(accountId, collateralType, requiredAmount);
        }
    }

    /**
     * @notice Repays specified amount of debt, depositing any additional necessary amount of system stables to the system
     * @param coreProxyAddress CoreProxy contract address
     * @param accountId Account ID
     * @param poolId Pool ID
     * @param collateralType Collateral token address
     * @param debtAmount Amount of debt to repay
     */
    function _repay(
        address coreProxyAddress,
        uint128 accountId,
        uint128 poolId,
        address collateralType,
        uint256 debtAmount
    ) internal {
        IERC20 usdToken = IMarketManagerModule(coreProxyAddress).getUsdToken();
        // Get deposited amount of USD Tokens available for repayment
        _ensureDeposit(coreProxyAddress, accountId, address(usdToken), debtAmount);
        // Now we have more or exact amount of USD tokens deposited to repay the debt
        IIssueUSDModule(coreProxyAddress).burnUsd(accountId, poolId, collateralType, debtAmount);
    }

    /**
     * @notice Clears the debt to 0, repays positive debt or mints extra system stable in case of negative debt
     * @param coreProxyAddress CoreProxy contract address
     * @param accountId Account ID
     * @param poolId Pool ID
     * @param collateralType Collateral token address
     */
    function _clearDebt(address coreProxyAddress, uint128 accountId, uint128 poolId, address collateralType) internal {
        // Get current debt for position
        int256 debt = IVaultModule(coreProxyAddress).getPositionDebt(accountId, poolId, collateralType);
        if (debt > 0) {
            uint256 debtAmount = uint256(debt);
            _repay(coreProxyAddress, accountId, poolId, collateralType, debtAmount);
        } else if (debt < 0) {
            // Claim negative debt
            IIssueUSDModule(coreProxyAddress).mintUsd(accountId, poolId, collateralType, uint256(-debt));
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
