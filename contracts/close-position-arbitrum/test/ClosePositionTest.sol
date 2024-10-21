// SPDX-License-Identifier: MIT
// solhint-disable one-contract-per-file, var-name-mixedcase, func-name-mixedcase
pragma solidity ^0.8.21;

import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {MintableToken} from "./MintableToken.sol";
import {ClosePosition} from "../src/ClosePosition.sol";
import {ISynthetixCore} from "../src/lib/ISynthetixCore.sol";


contract CoreProxyMock {
    int256 public positionDebt;
    function setPositionDebt(
        int256 positionDebt_
    ) public {
        positionDebt = positionDebt_;
    }
    function getPositionDebt(
        uint128, // accountId_
        uint128, // poolId_
        address // collateralType_
    ) public view returns (int256) {
        return positionDebt;
    }

    uint256 public accountAvailableCollateral;
    function setAccountAvailableCollateral(
        uint256 accountAvailableCollateral_
    ) public {
        accountAvailableCollateral = accountAvailableCollateral_;
    }
    function getAccountAvailableCollateral(
        uint128, // accountId_,
        address // collateralType_
    ) public view returns (uint256) {
        return accountAvailableCollateral;
    }

    address public usdToken;
    function setUsdToken(address usdToken_) public {
        usdToken = usdToken_;
    }
    function getUsdToken() public view returns (address) {
        return usdToken;
    }


    uint256 public depositAmount;
    function setDeposit(uint256 depositAmount_) public {
        depositAmount = depositAmount_;
    }
    function deposit(
        uint128, // accountId_,
        address, // collateralType_,
        uint256 tokenAmount_
    ) public {
        depositAmount = tokenAmount_;
    }


    uint256 public delegatedCollateral;
    function setDelegatedCollateral(uint256 delegatedCollateral_) public {
        delegatedCollateral = delegatedCollateral_;
    }
    function delegateCollateral(
        uint128, // accountId_,
        uint128, // poolId_,
        address, // collateralType_,
        uint256 newCollateralAmountD18_,
        uint256 // leverage_
    ) public {
        delegatedCollateral = newCollateralAmountD18_;
    }
}

contract ClosePositionTest is Test {
    MintableToken internal USDx;
    MintableToken internal ARB;
    ClosePosition internal closePosition;
    CoreProxyMock internal coreProxy;

    function setUp() public {
        USDx = new MintableToken("USDx", 18);
        ARB = new MintableToken("ARB", 18);
        coreProxy = new CoreProxyMock();
        coreProxy.setUsdToken(address(USDx));
        coreProxy.setDeposit(100);
        coreProxy.setDelegatedCollateral(1000);
        closePosition = new ClosePosition();
    }

    function test_ok() public {
        closePosition.closePosition(address(coreProxy), 1, 1, address(ARB));
        console.log('delegatedCollateral', coreProxy.delegatedCollateral());
        assertEq(coreProxy.delegatedCollateral(), 0);
    }
}
