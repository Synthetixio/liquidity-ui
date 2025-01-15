// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC2771Context} from "@synthetixio/core-contracts/contracts/utils/ERC2771Context.sol";
import {ICollateralModule} from "@synthetixio/main/contracts/interfaces/ICollateralModule.sol";
import {IIssueUSDModule} from "@synthetixio/main/contracts/interfaces/IIssueUSDModule.sol";
import {IVaultModule} from "@synthetixio/main/contracts/interfaces/IVaultModule.sol";
import {IAccountModule} from "@synthetixio/main/contracts/interfaces/IAccountModule.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {IERC721Receiver} from "@synthetixio/core-contracts/contracts/interfaces/IERC721Receiver.sol";
import {IERC721Enumerable} from "@synthetixio/core-contracts/contracts/interfaces/IERC721Enumerable.sol";
import {IERC721} from "@synthetixio/core-contracts/contracts/interfaces/IERC721.sol";
import {IWrapperModule} from "@synthetixio/spot-market/contracts/interfaces/IWrapperModule.sol";
import {IAtomicOrderModule} from "@synthetixio/spot-market/contracts/interfaces/IAtomicOrderModule.sol";
import {Price} from "@synthetixio/spot-market/contracts/storage/Price.sol";

interface IStaticAaveToken {
    function previewDeposit(
        //
        uint256 assets
    ) external view returns (uint256);

    function previewWithdraw(
        //
        uint256 assets
    ) external view returns (uint256);

    function deposit(
        //
        uint256 assets,
        address receiver,
        uint16 referralCode,
        bool depositToAave
    ) external returns (uint256);

    function maxWithdraw(
        //
        address owner
    ) external view returns (uint256);
}

contract PositionManager {
    error NotEnoughAllowance(
        address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance
    );
    error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount);
    error AccountExists();

    address public coreProxyAddress;
    address public accountProxyAddress;
    address public spotMarketAddress;
    address public usdcTokenAddress;
    address public usdcSynthAddress;
    uint128 public usdcSynthId;
    address public statausdcTokenAddress;
    address public statausdcSynthAddress;
    uint128 public statausdcSynthId;
    uint128 public poolId;

    constructor(
        address coreProxyAddress_,
        address accountProxyAddress_,
        address spotMarketAddress_,
        address usdcTokenAddress_,
        address usdcSynthAddress_,
        uint128 usdcSynthId_,
        address statausdcTokenAddress_,
        address statausdcSynthAddress_,
        uint128 statausdcSynthId_,
        uint128 poolId_
    ) {
        coreProxyAddress = coreProxyAddress_;
        accountProxyAddress = accountProxyAddress_;
        spotMarketAddress = spotMarketAddress_;
        usdcTokenAddress = usdcTokenAddress_;
        usdcSynthAddress = usdcSynthAddress_;
        usdcSynthId = usdcSynthId_;
        statausdcTokenAddress = statausdcTokenAddress_;
        statausdcSynthAddress = statausdcSynthAddress_;
        statausdcSynthId = statausdcSynthId_;
        poolId = poolId_;
    }

    /**
     * @notice Retrieves the list of account IDs associated with the caller
     * @dev Uses the ERC2771Context to get the correct sender address for meta-transactions
     * @return accountIds An array containing all account IDs owned by the caller
     */
    function getAccounts() public view returns (uint128[] memory accountIds) {
        address msgSender = ERC2771Context._msgSender();
        uint256 numberOfAccountTokens = IERC721(accountProxyAddress).balanceOf(msgSender);
        if (numberOfAccountTokens == 0) {
            return new uint128[](0);
        }
        accountIds = new uint128[](numberOfAccountTokens);
        for (uint256 i = 0; i < numberOfAccountTokens; i++) {
            // Retrieve the token/account ID at the index
            uint256 accountId = IERC721Enumerable(accountProxyAddress).tokenOfOwnerByIndex(
                //
                msgSender,
                i
            );
            accountIds[i] = uint128(accountId); // Downcast to uint128, assuming IDs fit within uint128
        }
        return accountIds;
    }

    /**
     * @notice Creates new account, deposits collateral to the system and then delegates it to the pool
     * @param usdcAmount The amount of collateral to delegate. This is a relative number
     */
    function setupPosition(uint256 usdcAmount) public {
        address msgSender = ERC2771Context._msgSender();
        if (IERC721(accountProxyAddress).balanceOf(msgSender) > 0) {
            // Do not allow to create more accounts
            revert AccountExists();
        }
        uint128 accountId = IAccountModule(coreProxyAddress).createAccount();
        _increasePosition(accountId, usdcAmount);
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Deposits extra collateral to the system if needed and then delegates requested amount to the pool
     * @param accountId User's Synthetix v3 Account NFT ID
     * @param usdcAmount The amount of USDC to delegate. This is a relative number
     */
    function increasePosition(uint128 accountId, uint256 usdcAmount) public {
        address msgSender = ERC2771Context._msgSender();
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );
        _increasePosition(accountId, usdcAmount);
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Removes requested amount of liquidity from the pool, requires debt repayment
     * @param accountId User's Synthetix v3 Account NFT ID
     * @param usdcAmount The amount of USDC to undelegate. This is a relative number
     */
    function decreasePosition(uint128 accountId, uint256 usdcAmount) public {
        address msgSender = ERC2771Context._msgSender();

        // 1. Transfer Account NFT from the wallet
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );

        // 2. Clear account debt (must have enough USDC that will be converted 1:1 to snxUSD and burned)
        _clearDebt(accountId);

        // 3. Calculate synthStataUSDC amount to undelegate
        uint256 stataAmount = IStaticAaveToken(statausdcTokenAddress).previewWithdraw(usdcAmount);
        uint256 synthAmount = stataAmount * (10 ** 18) / (10 ** IERC20(statausdcTokenAddress).decimals());
        uint256 currentDelegatedAmount = IVaultModule(coreProxyAddress).getPositionCollateral(
            //
            accountId,
            poolId,
            statausdcSynthAddress
        );
        uint256 newDelegatedAmount = currentDelegatedAmount > synthAmount ? currentDelegatedAmount - synthAmount : 0;

        // 4. Reduce delegated amount of synthStataUSDC
        IVaultModule(coreProxyAddress).delegateCollateral(
            //
            accountId,
            poolId,
            statausdcSynthAddress,
            newDelegatedAmount,
            1e18
        );

        // 5. Transfer Account NFT back to the owner
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Withdraws all the USDC from user account to the wallet, unwraps synths converts stataUSDC along the way
     * @param accountId User's Synthetix v3 Account NFT ID
     */
    function withdraw(uint128 accountId) public {
        address msgSender = ERC2771Context._msgSender();

        // 1. Transfer Account NFT from the wallet
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );

        // 2. Get amount of available synth stataUSDC
        uint256 statausdcSynthAvailable = ICollateralModule(coreProxyAddress).getAccountAvailableCollateral(
            //
            accountId,
            statausdcSynthAddress
        );

        // 3. Withdraw all the available synth stataUSDC
        ICollateralModule(coreProxyAddress).withdraw(
            //
            accountId,
            statausdcSynthAddress,
            statausdcSynthAvailable
        );

        // 4. Unwrap synth stataUSDC back to stataUSDC token
        uint256 stataAmount = statausdcSynthAvailable * (10 ** IERC20(statausdcTokenAddress).decimals()) / (10 ** 18);
        IWrapperModule(spotMarketAddress).unwrap(
            //
            statausdcSynthId,
            statausdcSynthAvailable,
            stataAmount
        );

        // 5. Withdraw everything from AAVE
        uint256 usdcAmount = IStaticAaveToken(statausdcTokenAddress).maxWithdraw(address(this));

        // 6. Send all the USDC to the wallet
        IERC20(usdcTokenAddress).transferFrom(
            //
            address(this),
            msgSender,
            usdcAmount
        );

        // 7. Transfer Account NFT back to the owner
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Removes all provided liquidity from the pool, requires full debt repayment
     * @param accountId User's Synthetix v3 Account NFT ID
     */
    function closePosition(uint128 accountId) public {
        address msgSender = ERC2771Context._msgSender();
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );
        _clearDebt(accountId);
        IVaultModule(coreProxyAddress).delegateCollateral(
            //
            accountId,
            poolId,
            statausdcSynthAddress,
            0,
            1e18
        );
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Repays specified amount of debt, depositing any additional necessary amount of system stables to the system
     * @param accountId User's Synthetix v3 Account NFT ID
     * @param debtAmount Amount of debt to repay
     */
    function repay(uint128 accountId, uint256 debtAmount) public {
        address msgSender = ERC2771Context._msgSender();
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );
        _repay(accountId, debtAmount);
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Clears the debt to 0, repays positive debt or mints extra system stable in case of negative debt
     * @param accountId User's Synthetix v3 Account NFT ID
     */
    function clearDebt(uint128 accountId) public {
        address msgSender = ERC2771Context._msgSender();
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );
        _clearDebt(accountId);
        IERC721(accountProxyAddress).safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Transfers specified amount of tokens to the contract
     * @param tokenAddress Token address
     * @param tokenAmount Token amount
     */
    function _transfer(address tokenAddress, uint256 tokenAmount) internal {
        address msgSender = ERC2771Context._msgSender();
        uint256 availableAllowance = IERC20(tokenAddress).allowance(msgSender, address(this));
        if (tokenAmount > availableAllowance) {
            // Wallet does not have enough USD tokens to repay debt
            revert NotEnoughAllowance(
                //
                msgSender,
                tokenAddress,
                tokenAmount,
                availableAllowance
            );
        }
        uint256 availableAmount = IERC20(tokenAddress).balanceOf(msgSender);
        if (tokenAmount > availableAmount) {
            // Wallet does not have enough USD tokens to repay debt
            revert NotEnoughBalance(
                //
                msgSender,
                tokenAddress,
                tokenAmount,
                availableAmount
            );
        }
        IERC20(tokenAddress).transferFrom(
            //
            msgSender,
            address(this),
            tokenAmount
        );
    }

    /**
     * @notice Repays specified amount of debt, depositing any additional necessary amount of system stables to the system
     * @param accountId User's Synthetix v3 Account NFT ID
     * @param debtAmount Amount of debt to repay
     */
    function _repay(uint128 accountId, uint256 debtAmount) internal {
        // 1. Calculate how much USDC we need (technically should be 1:1)
        (uint256 synthAmount,) =
            IAtomicOrderModule(spotMarketAddress).quoteSellExactOut(usdcSynthId, debtAmount, Price.Tolerance.STRICT);
        uint256 usdcAmount = synthAmount * (10 ** IERC20(usdcTokenAddress).decimals()) / (10 ** 18);

        // 2. Transfer USDC tokens from the wallet
        _transfer(usdcTokenAddress, usdcAmount);

        // 3. Wrap USDC tokens to synthUSDC
        IERC20(usdcTokenAddress).approve(spotMarketAddress, usdcAmount);
        IWrapperModule(spotMarketAddress).wrap(
            //
            usdcSynthId,
            usdcAmount,
            synthAmount
        );

        // 4. Sell synthUSDC for snxUSD
        IAtomicOrderModule(spotMarketAddress).sellExactOut(
            //
            usdcSynthId,
            debtAmount,
            synthAmount,
            address(0)
        );

        // 5. Now we have more or exact amount of USD tokens deposited to repay the debt
        IIssueUSDModule(coreProxyAddress).burnUsd(
            //
            accountId,
            poolId,
            statausdcSynthAddress,
            debtAmount
        );
    }

    /**
     * @notice Clears the debt to 0, repays positive debt or mints extra system stable in case of negative debt
     * @param accountId User's Synthetix v3 Account NFT ID
     */
    function _clearDebt(uint128 accountId) internal {
        // Get current debt for position
        int256 debt = IVaultModule(coreProxyAddress).getPositionDebt(accountId, poolId, statausdcSynthAddress);
        if (debt > 0) {
            uint256 debtAmount = uint256(debt);
            _repay(accountId, debtAmount);
        } else if (debt < 0) {
            // Claim negative debt
            IIssueUSDModule(coreProxyAddress).mintUsd(accountId, poolId, statausdcSynthAddress, uint256(-debt));
        }
    }

    function _increasePosition(uint128 accountId, uint256 usdcAmount) internal {
        // 1. Transfer USDC tokens from the wallet
        _transfer(usdcTokenAddress, usdcAmount);

        // 2. Deposit USDC to AAVE and get stataUSDC tokens
        IERC20(usdcTokenAddress).approve(statausdcTokenAddress, usdcAmount);
        uint256 stataAmount = IStaticAaveToken(statausdcTokenAddress).deposit(
            //
            usdcAmount,
            address(this),
            0,
            true
        );

        // 3. Wrap stataUSDC tokens to synthStataUSDC
        IWrapperModule spotMarket = IWrapperModule(spotMarketAddress);
        IERC20(statausdcTokenAddress).approve(spotMarketAddress, stataAmount);
        uint256 synthAmount = stataAmount * (10 ** 18) / (10 ** IERC20(statausdcTokenAddress).decimals());
        spotMarket.wrap(
            //
            statausdcSynthId,
            stataAmount,
            synthAmount
        );

        // 4. Deposit synthStataUSDC to the Core
        IERC20(statausdcSynthAddress).approve(coreProxyAddress, synthAmount);
        ICollateralModule(coreProxyAddress).deposit(
            //
            accountId,
            statausdcSynthAddress,
            synthAmount
        );

        // 5. Delegate synthStataUSDC to the Pool
        uint256 currentPosition =
            IVaultModule(coreProxyAddress).getPositionCollateral(accountId, poolId, statausdcSynthAddress);
        IVaultModule(coreProxyAddress).delegateCollateral(
            //
            accountId,
            poolId,
            statausdcSynthAddress,
            currentPosition + synthAmount,
            1e18
        );
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
