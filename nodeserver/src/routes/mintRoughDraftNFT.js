const { ethers } = require("ethers");
const PinataSDK = require("@pinata/sdk");
const multer = require("multer");
const { Readable } = require("stream");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
require("dotenv").config();

// Firebase initialization
if (!getApps().length) {
  initializeApp({
    credential: cert(require("../../firebase-service-account.json")), // adjust path if needed
  });
}
const db = getFirestore();

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
      const imageStream = Readable.from(imageBuffer);

      // Upload image to IPFS
      let imageResponse;
      try {
        imageResponse = await pinata.pinFileToIPFS(imageStream, {
          pinataMetadata: { name: "project-image" },
        });
      } catch (err) {
        console.error("Pinata image upload failed:", err);
        return res.status(500).json({ error: "Failed to upload image to IPFS" });
      }

      const imageURI = `ipfs://${imageResponse.IpfsHash}`;

      // Upload metadata to IPFS
      const metadata = {
        name: title,
        description,
        image: imageURI,
      };

      let metadataResponse;
      try {
        metadataResponse = await pinata.pinJSONToIPFS(metadata, {
          pinataMetadata: { name: "project-metadata" },
        });
      } catch (err) {
        console.error("Pinata metadata upload failed:", err);
        return res.status(500).json({ error: "Failed to upload metadata to IPFS" });
      }

      const tokenBaseURI = `ipfs://${metadataResponse.IpfsHash}`;

      // Set base URI (optional)
      try {
        const tx = await roughDraftNFT.setBaseURI(tokenBaseURI + "/");
        await tx.wait();
      } catch (err) {
        console.warn("Base URI set might have failed or already set:", err.reason || err.message);
      }

      // Mint the NFT
      const tx = await roughDraftNFT.mint(creatorAddress);
      const receipt = await tx.wait();

      const mintEvent = receipt.logs.find(
        (log) =>
          log.topics[0] === roughDraftNFT.interface.getEventTopic("DraftMinted")
      );
      const tokenId = mintEvent
        ? ethers.getBigInt(mintEvent.topics[2]).toString()
        : "unknown";

      const tokenURI = `${tokenBaseURI}/${tokenId}`;

      // Save project to Firestore
      await db.collection("projects").doc(tokenId).set({
        title,
        description,
        creatorAddress,
        tokenId,
        tokenURI,
        imageURI, // 🔥 ensure this gets saved
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({ message: "NFT minted and saved", tokenId, tokenURI });
    } catch (error) {
      console.error("Mint NFT Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
];

module.exports = { mintRoughDraftNFTHandler };
