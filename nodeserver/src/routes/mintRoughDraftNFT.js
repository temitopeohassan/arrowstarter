// src/routes/mintRoughDraftNFT.js
const { ethers } = require("ethers");
const { PinataSDK } = require("pinata-web3");
const multer = require("multer");
const FormData = require("form-data");
require("dotenv").config();

// Load ABI and contract address
const { abi: ROUGHDRAFT_NFT_ABI } = require("../abis/RoughDraftNFT.json");
const ROUGHDRAFT_NFT_ADDRESS = process.env.ROUGHDRAFT_NFT_ADDRESS;

// Setup Pinata client
const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY,
});

// Setup Ethereum provider and signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const roughDraftNFT = new ethers.Contract(
  ROUGHDRAFT_NFT_ADDRESS,
  ROUGHDRAFT_NFT_ABI,
  wallet
);

// Setup multer for image file upload (in memory)
const upload = multer({ storage: multer.memoryStorage() });

const mintRoughDraftNFTHandler = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, creatorAddress } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const imageBuffer = req.file.buffer;

      // Upload image to IPFS via Pinata
      const imageForm = new FormData();
      imageForm.append("file", imageBuffer, { filename: "image.png" });

      let imageResponse;
      try {
        imageResponse = await pinata.pinFileToIPFS(imageForm);
      } catch (err) {
        console.error("Pinata image upload failed:", err);
        return res.status(500).json({ error: "Failed to upload image to IPFS" });
      }

      const imageURI = `ipfs://${imageResponse.IpfsHash}`;

      // Upload metadata to IPFS
      const metadata = { name: title, description, image: imageURI };

      let metadataResponse;
      try {
        metadataResponse = await pinata.pinJSONToIPFS(metadata);
      } catch (err) {
        console.error("Pinata metadata upload failed:", err);
        return res.status(500).json({ error: "Failed to upload metadata to IPFS" });
      }

      const metadataHash = metadataResponse.IpfsHash;
      const baseURI = `ipfs://${metadataHash}/`;

      // Set base URI (can be optional if already set)
      const setUriTx = await roughDraftNFT.setBaseURI(baseURI);
      await setUriTx.wait();

      // Mint NFT
      const tx = await roughDraftNFT.mint(creatorAddress);
      const receipt = await tx.wait();

      const transferLog = receipt.logs.find(log => log.topics[0] === ethers.id("Transfer(address,address,uint256)"));
      const tokenId = transferLog ? ethers.decodeLog(["uint256"], transferLog.topics[3])[0].toString() : null;

      res.status(201).json({
        message: "NFT minted successfully",
        tokenId,
        tokenURI: `${baseURI}${tokenId}`
      });
    } catch (error) {
      console.error("Mint NFT Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
];

module.exports = { mintRoughDraftNFTHandler };
