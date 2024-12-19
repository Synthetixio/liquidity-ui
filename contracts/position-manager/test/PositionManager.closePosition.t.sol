// SPDX-License-Identifier: MIT
// solhint-disable one-contract-per-file, var-name-mixedcase, func-name-mixedcase
pragma solidity ^0.8.21;

import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {MintableToken} from "./MintableToken.sol";
import {MintableNFT} from "./MintableNFT.sol";
import {PositionManager} from "src/PositionManager.sol";

contract CoreProxyMock {
    int256 public positionDebt = 999_999;

    function setPositionDebt(int256 positionDebt_) public {
        positionDebt = positionDebt_;
    }

    function getPositionDebt(
        uint128, // accountId_
        uint128, // poolId_
        address // collateralType_
    ) public view returns (int256) {
        return positionDebt;
    }

    uint256 public accountAvailableCollateral = 999_999;

    function setAccountAvailableCollateral(uint256 accountAvailableCollateral_) public {
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

    uint256 public depositAmount = 999_999;

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

    uint256 public delegatedCollateral = 999_999;

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

    uint256 public burnUsdAmount = 999_999;

    function burnUsd(
        uint128, // accountId_,
        uint128, // poolId_,
        address, // collateralType_,
        uint256 amount_
    ) public {
        burnUsdAmount = amount_;
    }

    uint256 public mintUsdAmount = 999_999;

    function mintUsd(
        uint128, // accountId_,
        uint128, // poolId_,
        address, // collateralType_,
        uint256 amount_
    ) public {
        mintUsdAmount = amount_;
    }
}

contract PositionManager_closePosition_E2E_Test is Test {
    address internal ALICE;
    uint128 internal accountId = 420;
    uint128 internal poolId = 1;
    MintableToken internal USDx;
    MintableToken internal ARB;
    PositionManager internal closePosition;
    CoreProxyMock internal coreProxy;
    MintableNFT internal accountProxy;

    function setUp() public {
        ALICE = vm.addr(0xA11CE);
        vm.startPrank(ALICE);
        console.log("ALICE", address(ALICE));

        USDx = new MintableToken("USDx", 18);
        ARB = new MintableToken("ARB", 18);

        coreProxy = new CoreProxyMock();
        coreProxy.setUsdToken(address(USDx));

        closePosition = new PositionManager();
        accountProxy = new MintableNFT("ACC");
    }

    function test_closePosition_NotEnoughAllowance() public {
        coreProxy.setPositionDebt(100);
        coreProxy.setAccountAvailableCollateral(69);

        accountProxy.mint(ALICE, accountId);
        accountProxy.approve(address(closePosition), accountId);

        vm.expectRevert(
            abi.encodeWithSelector(PositionManager.NotEnoughAllowance.selector, ALICE, address(USDx), 31, 0)
        );

        closePosition.closePosition(address(coreProxy), address(accountProxy), accountId, poolId, address(ARB));

        assertEq(accountProxy.ownerOf(accountId), ALICE, "should own Account NFT #420");
    }

    function test_closePosition_NotEnoughBalance() public {
        coreProxy.setPositionDebt(100);
        coreProxy.setAccountAvailableCollateral(69);

        USDx.approve(address(closePosition), 31); // allow PositionManager to spend extra 31 USDx for deposit

        accountProxy.mint(ALICE, accountId);
        accountProxy.approve(address(closePosition), accountId);

        vm.expectRevert(abi.encodeWithSelector(PositionManager.NotEnoughBalance.selector, ALICE, address(USDx), 31, 0));

        closePosition.closePosition(address(coreProxy), address(accountProxy), accountId, poolId, address(ARB));

        assertEq(accountProxy.ownerOf(accountId), ALICE, "should own Account NFT #420");
    }

    function test_closePosition_with_repay() public {
        coreProxy.setPositionDebt(100);
        coreProxy.setAccountAvailableCollateral(69);

        USDx.mint(ALICE, 1_000);
        USDx.approve(address(closePosition), 31); // allow PositionManager to spend extra 31 USDx for deposit

        accountProxy.mint(ALICE, accountId);
        accountProxy.approve(address(closePosition), accountId);

        closePosition.closePosition(address(coreProxy), address(accountProxy), accountId, poolId, address(ARB));

        assertEq(coreProxy.depositAmount(), 31, "should deposit extra 31 USDx");
        assertEq(coreProxy.burnUsdAmount(), 100, "should repay 100 USDx");
        assertEq(coreProxy.mintUsdAmount(), 999_999, "should not claim anything");
        assertEq(coreProxy.delegatedCollateral(), 0, "should reduce delegated amount to 0");

        assertEq(accountProxy.ownerOf(accountId), ALICE, "should own Account NFT #420");
    }

    function test_closePosition_with_claim() public {
        coreProxy.setPositionDebt(-200);
        coreProxy.setAccountAvailableCollateral(69);

        accountProxy.mint(ALICE, accountId);
        accountProxy.approve(address(closePosition), accountId);

        closePosition.closePosition(address(coreProxy), address(accountProxy), accountId, poolId, address(ARB));

        assertEq(coreProxy.depositAmount(), 999_999, "should not deposit anything");
        assertEq(coreProxy.burnUsdAmount(), 999_999, "should not repay anything");
        assertEq(coreProxy.mintUsdAmount(), 200, "should claim 200 USDx");
        assertEq(coreProxy.delegatedCollateral(), 0, "should reduce delegated amount to 0");

        assertEq(accountProxy.ownerOf(accountId), ALICE, "should own Account NFT #420");
    }
}
