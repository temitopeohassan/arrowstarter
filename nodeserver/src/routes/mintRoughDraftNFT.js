// src/routes/mintRoughDraftNFT.js
const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const { create } = require("ipfs-http-client");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
require("dotenv").config();

// Load environment variables
const ROUGHDRAFT_NFT_ABI = require("../abis/RoughDraftNFT.json");
const ROUGHDRAFT_NFT_ADDRESS = process.env.ROUGHDRAFT_NFT_ADDRESS;

// Setup IPFS client
const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
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
 * Upload metadata to IPFS and mint a RoughDraftNFT.
 * Required fields: title, description, image (file)
 */
router.post("/mint-roughdraft", upload.single("image"), async (req, res) => {
  try {
    const { title, description, creatorAddress } = req.body;
    const imageBuffer = req.file.buffer;

    // 1. Upload image to IPFS
    const imageResult = await ipfs.add(imageBuffer);
    const imageURI = `https://ipfs.io/ipfs/${imageResult.path}`;

    // 2. Create metadata
    const metadata = {
      name: title,
      description,
      image: imageURI,
    };

    const metadataResult = await ipfs.add(JSON.stringify(metadata));
    const tokenURI = `https://ipfs.io/ipfs/${metadataResult.path}`;

    // 3. Mint NFT to creator
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
