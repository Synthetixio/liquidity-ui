// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IERC20} from "@synthetixio/core-contracts/contracts/interfaces/IERC20.sol";

interface ISNXProxy {
    function target() external returns (address snx);
}

interface ISNX is IERC20 {
    function transferableSynthetix(address account) external view returns (uint256 transferable);
}
