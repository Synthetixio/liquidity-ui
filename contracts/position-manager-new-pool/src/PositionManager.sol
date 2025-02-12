// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {
    ICoreProxy,
    PoolCollateralConfiguration,
    CollateralConfiguration
} from "@synthetixio/v3-contracts/1-main/ICoreProxy.sol";
import {IAccountProxy} from "@synthetixio/v3-contracts/1-main/IAccountProxy.sol";
import {IUSDProxy} from "@synthetixio/v3-contracts/1-main/IUSDProxy.sol";
import {ITreasuryMarketProxy} from "@synthetixio/v3-contracts/1-main/ITreasuryMarketProxy.sol";
import {ILegacyMarketProxy} from "@synthetixio/v3-contracts/1-main/ILegacyMarketProxy.sol";
import {IV2xUsd} from "@synthetixio/v3-contracts/1-main/IV2xUsd.sol";
import {IV2x} from "@synthetixio/v3-contracts/1-main/IV2x.sol";

import {ERC2771Context} from "@synthetixio/core-contracts/contracts/utils/ERC2771Context.sol";
import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";
import {IERC721Receiver} from "@synthetixio/core-contracts/contracts/interfaces/IERC721Receiver.sol";
import {ICoreProxyWithMigration} from "./ICoreProxyWithMigration.sol";
import {IAddressResolver} from "./IAddressResolver.sol";

contract PositionManagerNewPool {
    error NotEnoughAllowance(
        address walletAddress, address tokenAddress, uint256 requiredAllowance, uint256 availableAllowance
    );
    error NotEnoughBalance(address walletAddress, address tokenAddress, uint256 requiredAmount, uint256 availableAmount);

    ICoreProxy public CoreProxy;
    IAccountProxy public AccountProxy;
    ITreasuryMarketProxy public TreasuryMarketProxy;
    ILegacyMarketProxy public LegacyMarketProxy;
    IAddressResolver public V2xResolver;

    uint256 public constant UINT256_MAX = type(uint256).max;

    constructor(
        //
        address CoreProxy_,
        address AccountProxy_,
        address TreasuryMarketProxy_,
        address LegacyMarketProxy_
    ) {
        CoreProxy = ICoreProxy(CoreProxy_);
        AccountProxy = IAccountProxy(AccountProxy_);
        TreasuryMarketProxy = ITreasuryMarketProxy(TreasuryMarketProxy_);
        LegacyMarketProxy = ILegacyMarketProxy(LegacyMarketProxy_);
        V2xResolver = IAddressResolver(LegacyMarketProxy.v2xResolver());
    }

    function getV2x() public view returns (address v2x) {
        v2x = V2xResolver.getAddress("Synthetix");
    }

    function getV2xUsd() public view returns (address v2xUsd) {
        v2xUsd = V2xResolver.getAddress("SynthsUSD");
    }

    function get$SNX() public view returns (address $SNX) {
        $SNX = V2xResolver.getAddress("ProxySynthetix");
    }

    function get$sUSD() public view returns (address $sUSD) {
        $sUSD = V2xResolver.getAddress("ProxysUSD");
    }

    function get$snxUSD() public view returns (address $snxUSD) {
        $snxUSD = CoreProxy.getUsdToken();
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
     * @notice Retrieves the total deposit amount of SNX collateral across all accounts owned by the caller
     * @dev Iterates through all accounts owned by the caller and sums up their collateral in the specified pool
     * @return totalDeposit The total amount of SNX collateral deposited across all caller-owned accounts
     */
    function getTotalDeposit() public view returns (uint256 totalDeposit) {
        uint128[] memory accountIds = getAccounts();
        totalDeposit = 0;
        uint128 poolId = TreasuryMarketProxy.poolId();
        address $SNX = get$SNX();
        for (uint256 i = 0; i < accountIds.length; i++) {
            totalDeposit = totalDeposit + CoreProxy.getPositionCollateral(accountIds[i], poolId, $SNX);
        }
    }

    /**
     * @notice Retrieves the total loan amount across all accounts owned by the caller
     * @dev Iterates through all accounts owned by the caller and sums up their loaned amounts
     * @return totalLoan The total loan amount across all caller-owned accounts
     */
    function getTotalLoan() public view returns (uint256 totalLoan) {
        uint128[] memory accountIds = getAccounts();
        totalLoan = 0;
        for (uint256 i = 0; i < accountIds.length; i++) {
            totalLoan = totalLoan + TreasuryMarketProxy.loanedAmount(accountIds[i]);
        }
    }

    /**
     * @notice Migrates the user's entire position from an existing pool to the Delegated Staking pool.
     * @dev Transfers the user's account NFT to this contract, performs delegation migration, and transfers the account NFT back to the user.
     * @param sourcePoolId The ID of the source pool where the position is currently held.
     * @param accountId The unique ID of the user's Synthetix v3 Account NFT.
     */
    function migratePosition(uint128 sourcePoolId, uint128 accountId) public {
        address msgSender = ERC2771Context._msgSender();

        AccountProxy.transferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );

        // Migrate old pool position to the new pool
        ICoreProxyWithMigration(address(CoreProxy)).migrateDelegation(
            //
            accountId,
            sourcePoolId,
            get$SNX(),
            TreasuryMarketProxy.poolId()
        );
        TreasuryMarketProxy.saddle(accountId);

        AccountProxy.transferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Creates a new account, deposits the specified amount of SNX collateral into the system, delegates it to the SC pool, and mints snxUSD using the delegated collateral. Position is then migrated to the Delegated Staking pool
     * @dev The collateral is transferred from the caller's wallet, so sufficient balance and allowance are required.
     * The resulting account and collateral are managed as an NFT owned by the caller.
     * @param $SNXAmount The amount of SNX collateral to delegate. Input UINT256_MAX to use the maximum transferable balance.
     */
    function setupPosition(uint256 $SNXAmount) public {
        address msgSender = ERC2771Context._msgSender();

        uint128 accountId = CoreProxy.createAccount();

        uint128 scPoolId = 1; // SC Pool id is always 1
        _increasePosition(accountId, $SNXAmount, scPoolId);
        _maxMint(accountId, scPoolId);
        ICoreProxyWithMigration(address(CoreProxy)).migrateDelegation(
            //
            accountId,
            scPoolId,
            get$SNX(),
            TreasuryMarketProxy.poolId()
        );
        TreasuryMarketProxy.saddle(accountId);

        AccountProxy.transferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    /**
     * @notice Fully closes the user's position by repaying loans,
     * withdrawing collateral, and transferring ownership of the account back to the user.
     * @dev This function handles loan repayment and collateral withdrawal. It ensures that all outstanding obligations are cleared before closing the position and all the outstanding collateral is transferred to user wallet
     * @param accountId The unique ID of the user's Synthetix v3 Account NFT.
     */
    function closePosition(uint128 accountId) public {
        address msgSender = ERC2771Context._msgSender();
        address $SNX = get$SNX();
        address $snxUSD = get$snxUSD();

        AccountProxy.transferFrom(
            //
            msgSender,
            address(this),
            uint256(accountId)
        );

        // 1. Repay outstanding loan (if needed)
        _repayLoan(accountId, UINT256_MAX);

        // 2. Unsaddle account, TreasuryMarketProxy will close position on behalf
        AccountProxy.approve(address(TreasuryMarketProxy), accountId);
        TreasuryMarketProxy.unsaddle(accountId);

        // 3. Get amount of available $snxUSD
        uint256 available$snxUSD = CoreProxy.getAccountAvailableCollateral(
            //
            accountId,
            $snxUSD
        );
        if (available$snxUSD > 0) {
            // 4. Withdraw all the available $snxUSD
            CoreProxy.withdraw(
                //
                accountId,
                $snxUSD,
                available$snxUSD
            );

            // 5. Send all the $snxUSD to the wallet
            IERC20($snxUSD).transfer(
                //
                msgSender,
                available$snxUSD
            );
        }

        // 6. Get amount of available SNX
        uint256 available$SNX = CoreProxy.getAccountAvailableCollateral(
            //
            accountId,
            $SNX
        );

        // 7. Withdraw all the available SNX
        CoreProxy.withdraw(
            //
            accountId,
            $SNX,
            available$SNX
        );

        // 8. Send all the SNX to the wallet
        IERC20($SNX).transfer(
            //
            msgSender,
            available$SNX
        );

        AccountProxy.transferFrom(
            //
            address(this),
            msgSender,
            uint256(accountId)
        );
    }

    function _maxMint(uint128 accountId, uint128 poolId) internal {
        address $SNX = get$SNX();
        PoolCollateralConfiguration.Data memory poolCollateralConfig =
            CoreProxy.getPoolCollateralConfiguration(poolId, $SNX);
        uint256 issuanceRatioD18 = poolCollateralConfig.issuanceRatioD18;
        if (issuanceRatioD18 == 0) {
            CollateralConfiguration.Data memory collateralConfig = CoreProxy.getCollateralConfiguration($SNX);
            issuanceRatioD18 = collateralConfig.issuanceRatioD18;
        }

        (, uint256 collateralValue,,) = CoreProxy.getPosition(accountId, poolId, $SNX);
        uint256 mintable$snxUSD = (collateralValue * 1e18) / issuanceRatioD18;
        CoreProxy.mintUsd(accountId, poolId, $SNX, mintable$snxUSD);
    }

    function _increasePosition(uint128 accountId, uint256 $SNXAmount, uint128 poolId) internal {
        address msgSender = ERC2771Context._msgSender();
        address $SNX = get$SNX();

        uint256 transferable$SNXAmount = IV2x(getV2x()).transferableSynthetix(msgSender);
        if ($SNXAmount == UINT256_MAX) {
            // 1a. Use ALL transferable $SNX
            $SNXAmount = transferable$SNXAmount;
        } else if ($SNXAmount > transferable$SNXAmount) {
            // 1b. Verify wallet has enough transferable $SNX
            revert NotEnoughBalance(
                //
                msgSender,
                $SNX,
                $SNXAmount,
                transferable$SNXAmount
            );
        }

        // 2. Verify wallet has enough allowance to transfer $SNX
        uint256 available$SNXAllowance = IERC20($SNX).allowance(
            //
            msgSender,
            address(this)
        );
        if ($SNXAmount > available$SNXAllowance) {
            revert NotEnoughAllowance(
                //
                msgSender,
                $SNX,
                $SNXAmount,
                available$SNXAllowance
            );
        }

        // 3. Transfer $SNX from user wallet to PositionManager
        IERC20($SNX).transferFrom(
            //
            msgSender,
            address(this),
            $SNXAmount
        );

        // 4. Deposit $SNX to the Core
        IERC20($SNX).approve(address(CoreProxy), $SNXAmount);
        CoreProxy.deposit(
            //
            accountId,
            $SNX,
            $SNXAmount
        );

        // 5. Delegate $SNX to the Pool
        uint256 currentPosition = CoreProxy.getPositionCollateral(
            //
            accountId,
            poolId,
            $SNX
        );
        CoreProxy.delegateCollateral(
            //
            accountId,
            poolId,
            $SNX,
            currentPosition + $SNXAmount,
            1e18
        );
    }

    function _repayLoan(uint128 accountId, uint256 $sUSDAmount) internal {
        uint256 currentLoan = TreasuryMarketProxy.loanedAmount(accountId);
        if (currentLoan > 0) {
            if (currentLoan < $sUSDAmount) {
                $sUSDAmount = currentLoan;
            }

            address msgSender = ERC2771Context._msgSender();
            address $sUSD = get$sUSD();
            uint256 transferable$sUSDAmount = IV2xUsd(getV2xUsd()).transferableSynths(msgSender);

            // 1. Verify wallet has enough transferable $sUSD
            if ($sUSDAmount > transferable$sUSDAmount) {
                revert NotEnoughBalance(
                    //
                    msgSender,
                    $sUSD,
                    $sUSDAmount,
                    transferable$sUSDAmount
                );
            }

            // 2. Verify wallet has enough allowance to transfer $sUSD
            uint256 available$sUSDAllowance = IERC20($sUSD).allowance(
                //
                msgSender,
                address(this)
            );
            if ($sUSDAmount > available$sUSDAllowance) {
                revert NotEnoughAllowance(
                    //
                    msgSender,
                    $sUSD,
                    $sUSDAmount,
                    available$sUSDAllowance
                );
            }

            // 3. Transfer $sUSD from user wallet to PositionManager
            IERC20($sUSD).transferFrom(
                //
                msgSender,
                address(this),
                $sUSDAmount
            );

            // 4. Allow LegacyMarketProxy to spend $sUSD
            IERC20($sUSD).approve(address(LegacyMarketProxy), $sUSDAmount);

            // 5. Convert $sUSD to $snxUSD
            LegacyMarketProxy.convertUSD($sUSDAmount);

            // 6. Allow TreasuryMarketProxy to spend $snxUSD
            IERC20(get$snxUSD()).approve(address(TreasuryMarketProxy), $sUSDAmount);

            // 7. Repay account loan (must have enough $sUSD that will be deposited to the Treasury Market)
            TreasuryMarketProxy.adjustLoan(
                //
                accountId,
                currentLoan - $sUSDAmount
            );
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
