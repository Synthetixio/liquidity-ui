// SPDX-License-Identifier: MIT
// solhint-disable one-contract-per-file, var-name-mixedcase, func-name-mixedcase
pragma solidity ^0.8.21;

import {Test} from 'forge-std/src/Test.sol';
import {DebtManager} from '../src/DebtManager.sol';

contract DebtManagerTest is Test {
    DebtManager internal debtManager;

    function setUp() public {
        debtManager = new DebtManager();
    }

    function test_ok() public view {}
}
