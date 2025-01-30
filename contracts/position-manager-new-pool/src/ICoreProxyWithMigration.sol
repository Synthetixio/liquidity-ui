// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// TODO: remove after deployment and v3-contracts/1-main/ICoreProxy.sol is updated
interface ICoreProxyWithMigration {
    function migrateDelegation(
        //
        uint128 accountId,
        uint128 oldPoolId,
        address collateralType,
        uint128 newPoolId
    ) external;
}
