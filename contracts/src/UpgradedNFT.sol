// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UpgradedNFT is ERC721, Ownable {
    uint256 private _nextTokenId = 1; // Start from 1 or 0 depending on your logic

    mapping(uint256 => uint256) public upgradedFromToken; // new tokenId => original tokenId
    mapping(uint256 => bool) public isUpgraded; // original tokenId => upgraded status

    event NFTUpgraded(uint256 indexed originalTokenId, uint256 indexed newTokenId, address indexed owner);

    constructor(address initialOwner) ERC721("Upgraded Project NFT", "UPNFT") Ownable(initialOwner) {}

    function upgradeNFT(address to, uint256 originalTokenId) external onlyOwner returns (uint256) {
        require(!isUpgraded[originalTokenId], "NFT already upgraded");

        uint256 newTokenId = _nextTokenId++;
        _safeMint(to, newTokenId);

        upgradedFromToken[newTokenId] = originalTokenId;
        isUpgraded[originalTokenId] = true;

        emit NFTUpgraded(originalTokenId, newTokenId, to);
        return newTokenId;
    }
}
