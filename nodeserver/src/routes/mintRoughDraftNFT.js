// src/routes/mintRoughDraftNFT.js
const { ethers } = require("ethers");
const { PinataSDK } = require("pinata-web3");
const multer = require("multer");
const FormData = require("form-data");
require("dotenv").config();

// Load ABI and address
const { abi: ROUGHDRAFT_NFT_ABI } = require("../abis/RoughDraftNFT.json");
const ROUGHDRAFT_NFT_ADDRESS = process.env.ROUGHDRAFT_NFT_ADDRESS;

// Setup Pinata client
const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
});

// Setup provider and contract
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const roughDraftNFT = new ethers.Contract(
  ROUGHDRAFT_NFT_ADDRESS,
  ROUGHDRAFT_NFT_ABI,
  wallet
);

// Multer for image upload
const upload = multer({ storage: multer.memoryStorage() });

const mintRoughDraftNFTHandler = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, creatorAddress } = req.body;
      const imageBuffer = req.file.buffer;

      const imageForm = new FormData();
      imageForm.append("file", imageBuffer, { filename: "image.png" });

      const imageResponse = await pinata.pinFileToIPFS(imageForm);
      const imageURI = `https://ipfs.io/ipfs/${imageResponse.IpfsHash}`;

      const metadata = { name: title, description, image: imageURI };
      const metadataResponse = await pinata.pinJSONToIPFS(metadata);
      const tokenURI = `https://ipfs.io/ipfs/${metadataResponse.IpfsHash}`;

      const tx = await roughDraftNFT.mintTo(creatorAddress, tokenURI);
      const receipt = await tx.wait();

      const tokenId = parseInt(receipt.logs.find(log => log.eventName === "Transfer")?.args?.tokenId);

      res.status(201).json({ message: "NFT minted", tokenId, tokenURI });
    } catch (error) {
      console.error("Mint NFT Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
];

module.exports = { mintRoughDraftNFTHandler };
