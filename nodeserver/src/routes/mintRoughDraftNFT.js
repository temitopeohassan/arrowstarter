// src/routes/mintRoughDraftNFT.js
const { ethers } = require("ethers");
const PinataSDK = require("@pinata/sdk"); // ✅ Use the correct SDK
const multer = require("multer");
const { Readable } = require("stream");
require("dotenv").config();

// Load ABI and contract address
const { abi: ROUGHDRAFT_NFT_ABI } = require("../abis/RoughDraftNFT.json");
const ROUGHDRAFT_NFT_ADDRESS = process.env.ROUGHDRAFT_NFT_ADDRESS;

// Setup Pinata client
const pinata = new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);

// Setup Ethereum provider and signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const roughDraftNFT = new ethers.Contract(
  ROUGHDRAFT_NFT_ADDRESS,
  ROUGHDRAFT_NFT_ABI,
  wallet
);

// Setup multer for in-memory image upload
const upload = multer({ storage: multer.memoryStorage() });

const mintRoughDraftNFTHandler = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, creatorAddress } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      // Convert buffer to stream for pinata
      const readableStream = Readable.from(req.file.buffer);

      // Upload image to IPFS
      const imageResult = await pinata.pinFileToIPFS(readableStream, {
        pinataMetadata: { name: `roughdraft-${Date.now()}` },
      });

      const imageURI = `https://ipfs.io/ipfs/${imageResult.IpfsHash}`;

      // Upload metadata to IPFS
      const metadata = { name: title, description, image: imageURI };
      const metadataResult = await pinata.pinJSONToIPFS(metadata);

      const tokenURI = `https://ipfs.io/ipfs/${metadataResult.IpfsHash}`;

      // Mint NFT
      const tx = await roughDraftNFT.mintTo(creatorAddress, tokenURI);
      const receipt = await tx.wait();

      const transferLog = receipt.logs.find((log) => log.fragment?.name === "Transfer");
      const tokenId = transferLog?.args?.tokenId?.toString();

      res.status(201).json({ message: "NFT minted", tokenId, tokenURI });
    } catch (error) {
      console.error("Mint NFT Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
];

module.exports = { mintRoughDraftNFTHandler };
