// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ICoreProxy} from "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";
import {IAccountProxy} from "@synthetixio/v3-contracts/1-main/IAccountProxy.sol";
import {ITreasuryMarketProxy} from "./ITreasuryMarketProxy.sol";

import {ERC2771Context} from "@synthetixio/core-contracts/contracts/utils/ERC2771Context.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {IERC721Receiver} from "@synthetixio/core-contracts/contracts/interfaces/IERC721Receiver.sol";
import {ISNX} from "./ISNX.sol";

contract PositionManagerNewPool {
    error NotEnoughAllowance(
        address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance
    );
    error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount);
    error AccountExists();

    ICoreProxy public CoreProxy;
    IAccountProxy public AccountProxy;
    ITreasuryMarketProxy public TreasuryMarketProxy;

    address public $SNX;
    address public $sUSD;

    uint128 public poolId;

    constructor(
        address CoreProxy_,
        address AccountProxy_,
        address TreasuryMarketProxy_,
        address $SNX_,
        address $sUSD_,
        uint128 poolId_
    ) {
        CoreProxy = ICoreProxy(CoreProxy_);
        AccountProxy = IAccountProxy(AccountProxy_);
        TreasuryMarketProxy = ITreasuryMarketProxy(TreasuryMarketProxy_);
        $SNX = $SNX_;
        $sUSD = $sUSD_;
        poolId = poolId_;
    }

    /**
     * @notice Retrieves the list of account IDs associated with the caller
     * @dev Uses the ERC2771Context to get the correct sender address for meta-transactions
     * @return accountIds An array containing all account IDs owned by the caller
     */
    function getAccounts() public view returns (uint128[] memory accountIds) {
        address msgSender = ERC2771Context._msgSender();
        uint256 numberOfAccountTokens = AccountProxy.balanceOf(msgSender);
        if (numberOfAccountTokens == 0) {
            return new uint128[](0);
        }
        accountIds = new uint128[](numberOfAccountTokens);
        for (uint256 i = 0; i < numberOfAccountTokens; i++) {
            // Retrieve the token/account ID at the index
            uint256 accountId = AccountProxy.tokenOfOwnerByIndex(
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
     * @param snxAmount The amount of collateral to delegate. This is a relative number
     */
    function setupPosition(uint256 snxAmount) public {
        address msgSender = ERC2771Context._msgSender();
        if (AccountProxy.balanceOf(msgSender) > 0) {
            // Do not allow to create more accounts
            revert AccountExists();
        }
        uint128 accountId = CoreProxy.createAccount();
        _increasePosition(accountId, snxAmount);
        AccountProxy.safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Deposits extra collateral to the system if needed and then delegates requested amount to the pool
     * @param accountId User's Synthetix v3 Account NFT ID
     * @param snxAmount The amount of SNX to delegate. This is a relative number
     */
    function increasePosition(uint128 accountId, uint256 snxAmount) public {
        address msgSender = ERC2771Context._msgSender();
        AccountProxy.safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );
        _increasePosition(accountId, snxAmount);
        AccountProxy.safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Repays part of the loan
     * @param accountId User's Synthetix v3 Account NFT ID
     * @param susdAmount The amount of sUSD to repay. This is a relative number. To close position set to any large number bigger than the loan (like MAX_UINT256)
     */
    function repayLoan(uint128 accountId, uint256 susdAmount) public {
        address msgSender = ERC2771Context._msgSender();

        // 1. Transfer Account NFT from the wallet
        AccountProxy.safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );

        // 2. Transfer sUSD tokens from the wallet to repay the loan
        uint256 currentLoan = TreasuryMarketProxy.loanedAmount(accountId);
        if (susdAmount > currentLoan) {
            susdAmount = currentLoan;
        }
        _transferERC20($sUSD, susdAmount);

        // 3. Repay account loan (must have enough sUSD that will be deposited to the Treasury Market)
        TreasuryMarketProxy.adjustLoan(
            //
            accountId,
            currentLoan - susdAmount
        );

        // 4. Unsaddle
        TreasuryMarketProxy.unsaddle(accountId);

        // 5. Transfer Account NFT back to the owner
        AccountProxy.safeTransferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Withdraws all the SNX from user account to the wallet, unwraps synths along the way
     * @param accountId User's Synthetix v3 Account NFT ID
     */
    function withdraw(uint128 accountId) public {
        address msgSender = ERC2771Context._msgSender();

        // 1. Transfer Account NFT from the wallet
        AccountProxy.safeTransferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );

        // 2. Get amount of available sUSD
        uint256 susdAvailable = CoreProxy.getAccountAvailableCollateral(
            //
            accountId,
            $sUSD
        );
        if (susdAvailable > 0) {
            // 3. Withdraw all the available sUSD
            CoreProxy.withdraw(
                //
                accountId,
                $sUSD,
                susdAvailable
            );
            // 4. Send all the sUSD to the wallet
            IERC20($sUSD).transfer(
                //
                msgSender,
                susdAvailable
            );
        }

        // 5. Get amount of available SNX
        uint256 snxAvailable = CoreProxy.getAccountAvailableCollateral(
            //
            accountId,
            $SNX
        );

        // 6. Withdraw all the available SNX
        CoreProxy.withdraw(
            //
            accountId,
            $SNX,
            snxAvailable
        );

        // 7. Send all the SNX to the wallet
        ISNX($SNX).transfer(
            //
            msgSender,
            snxAvailable
        );

        // 8. Transfer Account NFT back to the owner
        AccountProxy.safeTransferFrom(
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
    function _transferERC20(address tokenAddress, uint256 tokenAmount) internal {
        address msgSender = ERC2771Context._msgSender();
        uint256 availableAllowance = IERC20(tokenAddress).allowance(msgSender, address(this));
        if (tokenAmount > availableAllowance) {
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
     * @notice Transfers specified amount of tokens to the contract
     * @param snxAmount Token amount
     */
    function _transferSNX(uint256 snxAmount) internal {
        address msgSender = ERC2771Context._msgSender();
        uint256 availableAllowance = ISNX($SNX).allowance(msgSender, address(this));
        if (snxAmount > availableAllowance) {
            revert NotEnoughAllowance(
                //
                msgSender,
                $SNX,
                snxAmount,
                availableAllowance
            );
        }
        uint256 availableAmount = ISNX($SNX).transferableSynthetix(msgSender);
        if (snxAmount > availableAmount) {
            revert NotEnoughBalance(
                //
                msgSender,
                $SNX,
                snxAmount,
                availableAmount
            );
        }
        ISNX($SNX).transferFrom(
            //
            msgSender,
            address(this),
            snxAmount
        );
    }

    function _increasePosition(uint128 accountId, uint256 snxAmount) internal {
        address msgSender = ERC2771Context._msgSender();

        // 1. Transfer SNX tokens from the wallet
        if (snxAmount == 0) {
            // All in!
            snxAmount = ISNX($SNX).transferableSynthetix(msgSender);
        }
        _transferERC20($SNX, snxAmount);

        // 2. Deposit SNX to the Core
        ISNX($SNX).approve(address(CoreProxy), snxAmount);
        CoreProxy.deposit(
            //
            accountId,
            $SNX,
            snxAmount
        );

        // 3. Delegate synthSNX to the Pool
        uint256 currentPosition = CoreProxy.getPositionCollateral(accountId, poolId, $SNX);
        CoreProxy.delegateCollateral(
            //
            accountId,
            poolId,
            $SNX,
            currentPosition + snxAmount,
            1e18
        );

        // 4. Saddle account
        TreasuryMarketProxy.saddle(accountId);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
