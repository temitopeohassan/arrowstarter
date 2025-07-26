// src/routes/mintRoughDraftNFT.js
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const { PinataSDK } = require("pinata-web3");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
require("dotenv").config();
const FormData = require("form-data");

// Load environment variables
const ROUGHDRAFT_NFT_ABI = require("../abis/RoughDraftNFT.json");
const ROUGHDRAFT_NFT_ADDRESS = process.env.ROUGHDRAFT_NFT_ADDRESS;

// Setup Pinata client
const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
});

// Setup provider and signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const roughDraftNFT = new ethers.Contract(
  ROUGHDRAFT_NFT_ADDRESS,
  ROUGHDRAFT_NFT_ABI,
  wallet
);

/**
 * Upload metadata to Pinata and mint a RoughDraftNFT.
 */
router.post("/mint-roughdraft", upload.single("image"), async (req, res) => {
  try {
    const { title, description, creatorAddress } = req.body;
    const imageBuffer = req.file.buffer;

    // 1. Upload image to IPFS via Pinata
    const imageForm = new FormData();
    imageForm.append("file", imageBuffer, {
      filename: "image.png", // optional: customize filename
    });

    const imageResponse = await pinata.pinFileToIPFS(imageForm);
    const imageURI = `https://ipfs.io/ipfs/${imageResponse.IpfsHash}`;

    // 2. Create and upload metadata to IPFS via Pinata
    const metadata = {
      name: title,
      description,
      image: imageURI,
    };

    const metadataResponse = await pinata.pinJSONToIPFS(metadata);
    const tokenURI = `https://ipfs.io/ipfs/${metadataResponse.IpfsHash}`;

    // 3. Mint NFT
    const tx = await roughDraftNFT.mintTo(creatorAddress, tokenURI);
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => log.eventName === "Transfer");
    const tokenId = parseInt(event.args.tokenId);

    res.status(201).json({
      message: "RoughDraft NFT minted successfully",
      tokenId,
      tokenURI,
    });
  } catch (error) {
    console.error("Mint RoughDraft Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
