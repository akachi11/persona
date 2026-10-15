// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PersonaNFT
/// @notice Each token is an AI avatar. Its metadata (name, bio, personality, voice
///         settings, image URL) is stored fully on-chain as a base64 data URI, so no
///         IPFS service is needed.
contract PersonaNFT is ERC721URIStorage, Ownable {
    uint256 public mintPrice;
    uint256 public totalMinted;

    event PersonaMinted(address indexed owner, uint256 indexed tokenId);
    event MintPriceUpdated(uint256 newPrice);

    error InsufficientPayment(uint256 sent, uint256 required);
    error EmptyTokenURI();
    error WithdrawFailed();

    constructor(uint256 _mintPrice) ERC721("Persona", "PRSN") Ownable(msg.sender) {
        mintPrice = _mintPrice;
    }

    function mint(string calldata uri) external payable returns (uint256 tokenId) {
        if (msg.value < mintPrice) revert InsufficientPayment(msg.value, mintPrice);
        if (bytes(uri).length == 0) revert EmptyTokenURI();

        tokenId = totalMinted;
        totalMinted++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit PersonaMinted(msg.sender, tokenId);
    }

    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
        emit MintPriceUpdated(_mintPrice);
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }
}
