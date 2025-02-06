// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface IAddressResolver {
    function getAddress(bytes32 name) external view returns (address);
}
