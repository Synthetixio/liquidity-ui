// SPDX-License-Identifier: MIT
// solhint-disable one-contract-per-file, var-name-mixedcase, func-name-mixedcase
pragma solidity ^0.8.21;

import {Test} from "forge-std/src/Test.sol";
import {DebtRepayer} from "../src/DebtRepayer.sol";

contract DebtRepayerTest is Test {
    DebtRepayer internal debtRepayer;

    function setUp() public {
        debtRepayer = new DebtRepayer();
    }

    function test_ok() public view {
    }
}
