// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {MockERC721} from "forge-std/src/mocks/MockERC721.sol";

contract MintableNFT is MockERC721 {
    constructor(string memory _symbol) {
        initialize(string.concat("Mintable NFT ", _symbol), _symbol);
    }

    function mint(address to_, uint256 id_) public {
        _mint(to_, id_);
    }
}
