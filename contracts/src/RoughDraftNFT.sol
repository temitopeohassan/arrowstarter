// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract RoughDraftNFT is ERC721Burnable, Ownable {
    uint256 private _nextTokenId = 1; // Start from 1 to avoid zero-token edge cases
    string private _baseTokenURI;

    event DraftMinted(address indexed to, uint256 indexed tokenId);
    event BaseURISet(string baseURI);

    constructor() ERC721("RoughDraftNFT", "DRAFT") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        emit DraftMinted(to, tokenId);
        return tokenId;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURISet(baseURI);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
